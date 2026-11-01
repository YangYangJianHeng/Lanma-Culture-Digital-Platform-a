package com.lanma.culture.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 微信一键登录请求
 * <p>
 * 小程序端通过 {@code wx.login} 拿到临时 code,连同用户授权的头像/昵称一起发到后端;
 * 后端使用 code + appid/appsecret 调微信 {@code jscode2session} 换 openid,进而查找或自动创建账号。
 * <p>
 * 如果后端未配置 appid/appsecret(开发期),则使用 {@code code + nickname} 计算稳定哈希作为
 * 伪 openid,保证同一用户多次使用一键登录能落到同一账号。
 */
@Data
public class WxLoginRequest {

    /** wx.login 返回的临时凭证(必填) */
    @NotBlank(message = "code 不能为空")
    private String code;

    /** 用户昵称 - 首次登录会用作 username 显示 */
    private String nickname;

    /** 用户头像 URL - 首次登录会写入 avatarUrl */
    private String avatarUrl;

    /**
     * 手机号加密数据(可选) — 当小程序开通 getPhoneNumber 后,可一并解密绑定。
     * 包含 encryptedData / iv / cloudID 三个字段。
     */
    private String encryptedData;

    private String iv;

    /** 客户端标识(可选) - 用于多端区分 */
    private String client;
}