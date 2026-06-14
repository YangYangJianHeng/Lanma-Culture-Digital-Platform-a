import React, { useRef, useCallback } from 'react';
import { Button, Tooltip, App } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  PictureOutlined,
  LinkOutlined,
  FontSizeOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import request from '../../api/request';

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  height?: number;
}

function cleanPastedHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;

  const all = div.querySelectorAll('*');
  all.forEach(el => {
    el.removeAttribute('style');
    el.removeAttribute('class');
    el.removeAttribute('id');
    el.removeAttribute('lang');
    el.removeAttribute('dir');
    if (el.getAttribute('width') === '') el.removeAttribute('width');
    if (el.getAttribute('height') === '') el.removeAttribute('height');
  });

  // Ensure images have proper styling
  div.querySelectorAll('img').forEach(img => {
    img.setAttribute('style', 'max-width:100%;border-radius:8px;margin:12px 0;');
  });

  // Remove empty trailing paragraphs
  while (div.lastChild?.nodeType === Node.ELEMENT_NODE) {
    const el = div.lastChild as HTMLElement;
    if (el.tagName === 'P' && (!el.textContent?.trim()) && !el.querySelector('img, video, iframe')) {
      div.removeChild(el);
    } else break;
  }

  return div.innerHTML;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value = '', onChange, height = 500 }) => {
  const { message } = App.useApp();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  const editorRefCallback = useCallback((el: HTMLDivElement | null) => {
    if (el && !initializedRef.current) {
      el.innerHTML = value;
      initializedRef.current = true;
    }
    (editorRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
  }, [value]);

  const notifyChange = useCallback(() => {
    if (!editorRef.current || !onChange) return;
    onChange(editorRef.current.innerHTML);
  }, [onChange]);

  const execCmd = useCallback((cmd: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(cmd, false, arg);
    notifyChange();
  }, [notifyChange]);

  const insertHtmlAtCursor = useCallback((html: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();

    try {
      document.execCommand('insertHTML', false, html);
    } catch {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const frag = range.createContextualFragment(html);
        range.insertNode(frag);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
    notifyChange();
  }, [notifyChange]);

  const uploadImage = useCallback(async (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      message.error('图片超过 100MB 大小限制');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Do NOT set Content-Type — let browser set it with boundary
      const res: any = await request.post('/upload', formData, { timeout: 120000 });
      const imageUrl = res.data.url;
      insertHtmlAtCursor(
        `<img src="${imageUrl}" alt="image" style="max-width:100%;border-radius:8px;margin:12px 0;" />`
      );
      message.success('图片插入成功');
    } catch (e: any) {
      if (e?.message === 'Network Error') {
        message.error('网络连接失败，请检查后端服务是否运行或文件是否过大');
      } else {
        message.error(e?.message || '图片上传失败');
      }
    }
  }, [insertHtmlAtCursor, message]);

  const uploadVideo = useCallback(async (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      message.error('视频超过 100MB 大小限制');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res: any = await request.post('/upload', formData, { timeout: 120000 });
      const videoUrl = res.data.url;
      insertHtmlAtCursor(
        `<video src="${videoUrl}" controls style="max-width:100%;border-radius:8px;margin:12px 0;" />`
      );
      message.success('视频插入成功');
    } catch (e: any) {
      if (e?.message === 'Network Error') {
        message.error('网络连接失败，请检查后端服务是否运行或文件是否过大');
      } else {
        message.error(e?.message || '视频上传失败');
      }
    }
  }, [insertHtmlAtCursor, message]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Image paste
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) uploadImage(file);
        return;
      }
    }

    // Video paste
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('video/')) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) uploadVideo(file);
        return;
      }
    }

    // HTML paste (WeChat etc.) — clean up
    if (e.clipboardData?.types?.includes('text/html')) {
      e.preventDefault();
      const rawHtml = e.clipboardData.getData('text/html');
      const text = e.clipboardData.getData('text/plain');
      if (rawHtml) {
        insertHtmlAtCursor(cleanPastedHtml(rawHtml));
      } else if (text) {
        insertHtmlAtCursor(text.replace(/\n/g, '<br>'));
      }
    } else {
      // Plain text — browser handles, then notify
      setTimeout(notifyChange, 0);
    }
  }, [uploadImage, uploadVideo, insertHtmlAtCursor, notifyChange]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      uploadImage(files[0]);
    }
    e.target.value = '';
  }, [uploadImage]);

  const handleVideoInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      uploadVideo(files[0]);
    }
    e.target.value = '';
  }, [uploadVideo]);

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 8, overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid #d9d9d9',
        background: '#fafafa',
        display: 'flex',
        flexWrap: 'wrap',
        gap: 4,
      }}>
        <Tooltip title="加粗 (Ctrl+B)">
          <Button type="text" size="small" icon={<BoldOutlined />} onMouseDown={e => { e.preventDefault(); execCmd('bold'); }} />
        </Tooltip>
        <Tooltip title="斜体 (Ctrl+I)">
          <Button type="text" size="small" icon={<ItalicOutlined />} onMouseDown={e => { e.preventDefault(); execCmd('italic'); }} />
        </Tooltip>
        <Tooltip title="标题">
          <Button type="text" size="small" icon={<FontSizeOutlined />} onMouseDown={e => { e.preventDefault(); execCmd('formatBlock', '<h2>'); }} />
        </Tooltip>
        <div style={{ width: 1, height: 24, background: '#e8e8e8', margin: '0 4px' }} />
        <Tooltip title="有序列表">
          <Button type="text" size="small" icon={<OrderedListOutlined />} onMouseDown={e => { e.preventDefault(); execCmd('insertOrderedList'); }} />
        </Tooltip>
        <Tooltip title="无序列表">
          <Button type="text" size="small" icon={<UnorderedListOutlined />} onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList'); }} />
        </Tooltip>
        <div style={{ width: 1, height: 24, background: '#e8e8e8', margin: '0 4px' }} />
        <Tooltip title="插入图片">
          <Button type="text" size="small" icon={<PictureOutlined />} onClick={() => fileInputRef.current?.click()} />
        </Tooltip>
        <Tooltip title="插入视频">
          <Button type="text" size="small" icon={<PlayCircleOutlined />} onClick={() => videoInputRef.current?.click()} />
        </Tooltip>
        <Tooltip title="插入链接">
          <Button type="text" size="small" icon={<LinkOutlined />} onMouseDown={e => { e.preventDefault(); const url = window.prompt('请输入链接地址：'); if (url) execCmd('createLink', url); }} />
        </Tooltip>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileInputChange} />
      <input ref={videoInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={handleVideoInputChange} />

      {/* Editor body */}
      <div
        ref={editorRefCallback}
        contentEditable
        suppressContentEditableWarning
        onInput={notifyChange}
        onPaste={handlePaste}
        style={{
          minHeight: height,
          padding: 16,
          outline: 'none',
          fontSize: 15,
          lineHeight: 1.9,
          color: '#333',
          overflowY: 'auto',
        }}
      />
    </div>
  );
};

export default RichTextEditor;
