-- V4__chat_feedback.sql — Lưu đánh giá câu trả lời chat (đặc biệt từ nguồn web)
-- Phục vụ: thu thập phản hồi user về chất lượng câu trả lời web fallback
-- Bảng riêng biệt với engagement (vì không gắn với post)

CREATE TABLE chat_feedback (
    feedback_id   BIGINT       NOT NULL AUTO_INCREMENT,
    member_id     BIGINT       NULL,                          -- NULL nếu user chưa đăng nhập
    question      TEXT         NOT NULL,
    answer        TEXT         NOT NULL,
    used_web      BOOLEAN      NOT NULL DEFAULT FALSE,
    source_url    VARCHAR(2000) NULL,
    rating        VARCHAR(20)  NOT NULL,                      -- GOOD | BAD | INSUFFICIENT
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (feedback_id),
    KEY idx_chat_feedback_rating (rating),
    KEY idx_chat_feedback_used_web (used_web),
    KEY idx_chat_feedback_created (created_at),
    CONSTRAINT fk_chat_feedback_member FOREIGN KEY (member_id) REFERENCES member (member_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
