import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloseOutlined, RightOutlined, EnvironmentOutlined, HeartOutlined, CalendarOutlined } from '@ant-design/icons';
import { marathonApi } from '../../api/marathons';
import { foodApi, FoodRecord } from '../../api/foods';
import { tourismApi, TourismRecord } from '../../api/tourism';
import { storyApi, StoryItem } from '../../api/stories';

const CARD_W = 480;
const CARD_H = 180;
const PAD = 30;

const FLOAT_CSS = `
@keyframes gf0 { 0% { transform: translate(0,0); } 33% { transform: translate(14px,-18px); } 66% { transform: translate(-10px,-5px); } 100% { transform: translate(6px,-12px); } }
@keyframes gf1 { 0% { transform: translate(0,0); } 33% { transform: translate(-16px,-12px); } 66% { transform: translate(12px,-20px); } 100% { transform: translate(-8px,-8px); } }
@keyframes gf2 { 0% { transform: translate(0,0); } 33% { transform: translate(10px,-20px); } 66% { transform: translate(-14px,-6px); } 100% { transform: translate(8px,-14px); } }
@keyframes gf3 { 0% { transform: translate(0,0); } 33% { transform: translate(-12px,-16px); } 66% { transform: translate(16px,-8px); } 100% { transform: translate(-6px,-18px); } }
@keyframes gf4 { 0% { transform: translate(0,0); } 33% { transform: translate(18px,-14px); } 66% { transform: translate(-8px,-22px); } 100% { transform: translate(-14px,-6px); } }
@keyframes gf5 { 0% { transform: translate(0,0); } 33% { transform: translate(-10px,-22px); } 66% { transform: translate(14px,-10px); } 100% { transform: translate(10px,-16px); } }
`;

function shufflePick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function randomPositions(count: number, vw: number, vh: number): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const gap = 14;
  for (let i = 0; i < count; i++) {
    let placed = false;
    for (let a = 0; a < 500; a++) {
      const x = PAD + Math.random() * (vw - PAD * 2 - CARD_W);
      const y = PAD + Math.random() * (vh - PAD * 2 - CARD_H);
      if (!out.some(p => Math.abs(p.x - x) < CARD_W + gap && Math.abs(p.y - y) < CARD_H + gap)) {
        out.push({ x, y }); placed = true; break;
      }
    }
    if (!placed) out.push({ x: PAD, y: PAD + i * (CARD_H + gap) });
  }
  return out;
}

function parseImages(item: any): string[] {
  if (!item.images) return [];
  try {
    const parsed = JSON.parse(item.images);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch { return []; }
}

interface ContentCard {
  key: string;
  type: 'marathon' | 'food' | 'tourism' | 'story';
  name: string;
  imageUrl: string;
  tag: string;
  desc: string;
  accent: string;
  meta: string;
  navTo: string;
}

// 各类型的玻璃色系
const TYPE_STYLE: Record<string, { accent: string; glass: string; border: string }> = {
  marathon: { accent: '#ffd700', glass: 'rgba(198,40,40,0.15)', border: 'rgba(255,215,0,0.15)' },
  food:   { accent: '#fb923c', glass: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.12)' },
  tourism: { accent: '#38bdf8', glass: 'rgba(56,189,248,0.12)', border: 'rgba(56,189,248,0.12)' },
  story:  { accent: '#10b981', glass: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.12)' },
};

const ContentFloatingCards: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<ContentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [anim, setAnim] = useState(false);
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);

  useEffect(() => {
    const fn = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  useEffect(() => {
    Promise.all([
      marathonApi.list().then(r => r.data).catch(() => []),
      foodApi.list().then(r => r.data as FoodRecord[]).catch(() => []),
      tourismApi.list().then(r => r.data as TourismRecord[]).catch(() => []),
      storyApi.list({ limit: 50 }).then(r => r.data.items as StoryItem[]).catch(() => []),
    ]).then(([marathons, foods, tourism, stories]) => {
      const marathonCards: ContentCard[] = marathons.map((m: any) => {
        const imgs = parseImages(m);
        const shortName = m.name.replace(/兰州马拉松/g, '').replace(String(m.year), '').trim() || '兰马';
        const slogan = m.slogan ? `"${m.slogan}"` : '';
        return {
          key: `marathon-${m.id}`, type: 'marathon',
          name: `${m.year}年 ${shortName}`,
          imageUrl: imgs[0] || '',
          tag: `${m.year}`,
          desc: slogan || (m.description ? m.description.replace(/<[^>]+>/g, '').slice(0, 45) : ''),
          accent: TYPE_STYLE.marathon.accent,
          meta: m.date ? m.date.slice(0, 10) : `${m.year}年`,
          navTo: '/marathons',
        };
      });

      const foodCards: ContentCard[] = shufflePick(foods, 2).map(f => ({
        key: `food-${f.id}`, type: 'food',
        name: f.name, imageUrl: f.image_url,
        tag: f.category || '美食',
        desc: f.description ? f.description.slice(0, 50) : '',
        accent: TYPE_STYLE.food.accent,
        meta: f.address || '兰州',
        navTo: `/food/${f.id}`,
      }));

      const tourismCards: ContentCard[] = shufflePick(tourism, 2).map(t => ({
        key: `tourism-${t.id}`, type: 'tourism',
        name: t.name, imageUrl: t.image_url,
        tag: t.category || '景点',
        desc: t.description ? t.description.slice(0, 50) : '',
        accent: TYPE_STYLE.tourism.accent,
        meta: t.address || '兰州',
        navTo: `/tourism/${t.id}`,
      }));

      const storyCards: ContentCard[] = shufflePick(stories, 2).map(s => ({
        key: `story-${s.id}`, type: 'story',
        name: s.title, imageUrl: s.images?.[0] || '',
        tag: `${s.race_year}年`,
        desc: s.content ? s.content.replace(/<[^>]+>/g, '').slice(0, 50) : '',
        accent: TYPE_STYLE.story.accent,
        meta: s.author?.username || '跑者',
        navTo: `/stories/${s.id}`,
      }));

      const all = [...marathonCards, ...foodCards, ...tourismCards, ...storyCards];
      // 洗牌打乱顺序
      for (let i = all.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [all[i], all[j]] = [all[j], all[i]];
      }
      setItems(all);
      setLoading(false);
      requestAnimationFrame(() => setAnim(true));
    });
  }, []);

  const visibleItems = useMemo(() => items.filter(item => !dismissed.has(item.key)), [items, dismissed]);
  const positions = useMemo(() => randomPositions(visibleItems.length, vw, vh), [visibleItems.length, vw, vh]);
  const animMeta = useMemo(() => visibleItems.map(() => ({
    delay: 0.03 + Math.random() * 0.25, dur: 5 + Math.random() * 3, idx: Math.floor(Math.random() * 6),
  })), [visibleItems]);

  if (!visible || loading || visibleItems.length === 0) return null;

  return (
    <>
      <style>{FLOAT_CSS}</style>
      <div style={{ position: 'absolute', inset: 0, zIndex: 40, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* 整体关闭 */}
        <button onClick={() => setVisible(false)}
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 50, width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto', backdropFilter: 'blur(8px)' }}>
          <CloseOutlined />
        </button>

        {visibleItems.map((item, i) => {
          const p = positions[i] || { x: PAD, y: PAD };
          const m = animMeta[i];
          const ts = TYPE_STYLE[item.type];
          const iconMap: Record<string, string> = { marathon: '🏅', food: '🍽️', tourism: '🏛️', story: '📖' };

          return (
            <div key={item.key}
              onClick={() => navigate(item.navTo)}
              style={{
                position: 'absolute', left: p.x, top: p.y,
                pointerEvents: 'auto', cursor: 'pointer',
                width: CARD_W, height: CARD_H, borderRadius: 16, overflow: 'hidden',
                background: ts.glass,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${ts.border}`,
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                opacity: anim ? 1 : 0,
                transform: anim ? 'scale(1)' : 'scale(0.2)',
                transition: `all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${m.delay}s`,
                animation: anim ? `gf${m.idx} ${m.dur}s ease-in-out ${m.delay + 0.7}s infinite alternate` : 'none',
                display: 'flex', flexDirection: 'row',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.04)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(0,0,0,0.25)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.15)'; }}>
              {/* 卡片关闭 */}
              <button onClick={e => { e.stopPropagation(); setDismissed(prev => { const s = new Set(prev); s.add(item.key); return s; }); }}
                style={{ position: 'absolute', top: 6, right: 6, zIndex: 10, width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.7)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                <CloseOutlined />
              </button>
              {/* 左图 */}
              <div style={{ width: 170, height: '100%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'rgba(0,0,0,0.15)' }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { (e.target as HTMLElement).style.display = 'none'; }} />
                ) : (
                  <span style={{ fontSize: 36, opacity: 0.4 }}>{iconMap[item.type] || '📌'}</span>
                )}
              </div>
              {/* 右文 — 玻璃效果 */}
              <div style={{
                flex: 1, padding: '14px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0,
                background: 'rgba(255,255,255,0.03)',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: ts.accent, background: `${ts.accent}22`, padding: '2px 8px', borderRadius: 10, flexShrink: 0 }}>
                      {item.tag}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                  </div>
                  {item.desc && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.desc}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {item.type === 'story' ? <HeartOutlined style={{ fontSize: 10 }} /> : item.type === 'marathon' ? <CalendarOutlined style={{ fontSize: 10 }} /> : <EnvironmentOutlined style={{ fontSize: 10 }} />}
                    {item.meta}
                  </div>
                  <div style={{ fontSize: 11, color: ts.accent, display: 'flex', alignItems: 'center', gap: 4, opacity: 0.7 }}>
                    查看详情 <RightOutlined style={{ fontSize: 10 }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ContentFloatingCards;
