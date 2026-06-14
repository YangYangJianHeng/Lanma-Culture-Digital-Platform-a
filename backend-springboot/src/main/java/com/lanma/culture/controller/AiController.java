package com.lanma.culture.controller;

import com.lanma.culture.dto.ApiResponse;
import com.lanma.culture.entity.AiConversation;
import com.lanma.culture.service.AiConversationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiConversationService conversationService;
    private static final String OLLAMA_API = "http://localhost:11434/api/chat";

    @PostMapping("/chat")
    public ResponseEntity<ApiResponse<Map<String, Object>>> chat(
            @RequestBody Map<String, Object> body,
            @RequestHeader(value = "X-User-Id", defaultValue = "0") Long userId) {

        String message = (String) body.get("message");
        String model = (String) body.getOrDefault("model", "llama3");

        // 保存用户消息
        AiConversation userMsg = new AiConversation();
        userMsg.setUserId(userId);
        userMsg.setRole("user");
        userMsg.setContent(message);
        userMsg.setSource("user");
        userMsg.setCreatedAt(LocalDateTime.now());
        conversationService.save(userMsg);

        String reply;
        String source;

        try {
            // 尝试连接本地 Ollama
            HttpClient client = HttpClient.newHttpClient();
            String ollamaBody = String.format(
                "{\"model\":\"%s\",\"messages\":[{\"role\":\"user\",\"content\":\"%s\"}],\"stream\":false}",
                model, message.replace("\"", "\\\""));

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(OLLAMA_API))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(ollamaBody))
                .timeout(java.time.Duration.ofSeconds(60))
                .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                var root = mapper.readTree(response.body());
                reply = root.get("message").get("content").asText();
                source = "ollama:" + model;
            } else {
                reply = "⚠️ Ollama 返回异常（" + response.statusCode() + "），请确认模型已加载。";
                source = "error";
            }
        } catch (java.net.ConnectException e) {
            reply = "🤖 我是小兰助手！我还没连接到本地大模型。\n\n请确保已启动 Ollama 并加载模型（如 `ollama run llama3`）。连接后我就能帮你回答关于兰州美食、旅游和文化的问题了！\n\n当前支持的功能：\n• 兰州美食推荐 🍜\n• 兰州旅游攻略 🏯\n• 兰马赛事咨询 🏃\n• 黄河文化问答 🌊";
            source = "fallback";
        } catch (Exception e) {
            reply = "😅 和小兰聊天出了点小问题，请稍后再试。";
            source = "error";
        }

        // 保存 AI 回复
        AiConversation aiMsg = new AiConversation();
        aiMsg.setUserId(userId);
        aiMsg.setRole("assistant");
        aiMsg.setContent(reply);
        aiMsg.setSource(source);
        aiMsg.setCreatedAt(LocalDateTime.now());
        conversationService.save(aiMsg);

        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "reply", reply,
            "source", source
        )));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<AiConversation>>> history(
            @RequestHeader(value = "X-User-Id", defaultValue = "0") Long userId) {
        return ResponseEntity.ok(ApiResponse.success(conversationService.getHistory(userId)));
    }
}
