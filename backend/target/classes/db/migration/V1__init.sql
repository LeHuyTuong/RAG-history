-- V1__init.sql — History RAG physical schema (17 bảng)
-- Khớp logical model: docs/22-logical-erd-v2.md
-- MySQL 8, InnoDB, utf8mb4 (tiếng Việt). MySQL = source of truth; Qdrant/Neo4j là bản chiếu.
-- Quy ước: PK = BIGINT AUTO_INCREMENT; timestamps DATETIME; FK đặt tên fk_<bảng>_<đích>.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- USERS / AUTH  (admin & member tách bảng; JWT access token KHÔNG lưu)
-- ============================================================================
CREATE TABLE admin (
    admin_id      BIGINT       NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',   -- ACTIVE | LOCKED
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (admin_id),
    UNIQUE KEY uq_admin_username (username),
    UNIQUE KEY uq_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE member (
    member_id     BIGINT       NOT NULL AUTO_INCREMENT,
    username      VARCHAR(50)  NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(255) NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (member_id),
    UNIQUE KEY uq_member_username (username),
    UNIQUE KEY uq_member_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Chỉ lưu REFRESH token (để thu hồi). Access token JWT tự verify bằng chữ ký, không lưu.
CREATE TABLE refresh_token (
    refresh_token_id BIGINT       NOT NULL AUTO_INCREMENT,
    member_id        BIGINT       NULL,
    admin_id         BIGINT       NULL,
    token_hash       VARCHAR(255) NOT NULL,
    expires_at       DATETIME     NOT NULL,
    revoked          BOOLEAN      NOT NULL DEFAULT FALSE,
    device_info      VARCHAR(255) NULL,
    ip_address       VARCHAR(45)  NULL,                     -- IPv6 tối đa 45 ký tự
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (refresh_token_id),
    KEY idx_refresh_token_hash (token_hash),
    KEY idx_refresh_token_member (member_id),
    KEY idx_refresh_token_admin (admin_id),
    KEY idx_refresh_token_expires (expires_at),
    CONSTRAINT fk_refresh_token_member FOREIGN KEY (member_id) REFERENCES member (member_id) ON DELETE CASCADE,
    CONSTRAINT fk_refresh_token_admin  FOREIGN KEY (admin_id)  REFERENCES admin (admin_id)   ON DELETE CASCADE,
    CONSTRAINT chk_refresh_token_owner CHECK (member_id IS NOT NULL OR admin_id IS NOT NULL)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- LỊCH SỬ (nhập tay): period, person, location, event
-- ============================================================================
CREATE TABLE period (
    period_id   BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) NOT NULL,
    start_year  INT          NULL,
    end_year    INT          NULL,
    description TEXT         NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (period_id),
    UNIQUE KEY uq_period_slug (slug),
    KEY idx_period_years (start_year, end_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE person (
    person_id  BIGINT       NOT NULL AUTO_INCREMENT,
    name       VARCHAR(255) NOT NULL,
    slug       VARCHAR(255) NOT NULL,
    alias      VARCHAR(255) NULL,
    birth_date DATE         NULL,
    death_date DATE         NULL,
    biography  TEXT         NULL,                           -- nội dung để embed
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (person_id),
    UNIQUE KEY uq_person_slug (slug),
    KEY idx_person_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE location (
    location_id   BIGINT       NOT NULL AUTO_INCREMENT,
    name          VARCHAR(255) NOT NULL,
    slug          VARCHAR(255) NOT NULL,
    location_type VARCHAR(50)  NULL,                        -- CITY | BATTLEFIELD | TEMPLE ...
    latitude      DECIMAL(9,6) NULL,
    longitude     DECIMAL(9,6) NULL,
    description   TEXT         NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (location_id),
    UNIQUE KEY uq_location_slug (slug),
    KEY idx_location_type (location_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE event (
    event_id        BIGINT       NOT NULL AUTO_INCREMENT,
    period_id       BIGINT       NULL,
    name            VARCHAR(500) NOT NULL,
    slug            VARCHAR(500) NOT NULL,
    description     TEXT         NULL,                      -- nội dung để embed
    start_year      INT          NULL,
    end_year        INT          NULL,
    start_date      DATE         NULL,
    end_date        DATE         NULL,
    certainty_level VARCHAR(20)  NULL,                      -- CERTAIN | ESTIMATED | DISPUTED
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id),
    UNIQUE KEY uq_event_slug (slug),
    KEY idx_event_period (period_id),
    KEY idx_event_start_year (start_year),
    KEY idx_event_certainty (certainty_level),
    CONSTRAINT fk_event_period FOREIGN KEY (period_id) REFERENCES period (period_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CMS: post, tag, post_tag, engagement
-- ============================================================================
CREATE TABLE post (
    post_id       BIGINT        NOT NULL AUTO_INCREMENT,
    admin_id      BIGINT        NOT NULL,
    event_id      BIGINT        NULL,                       -- 1 bài về 1 sự kiện (NULL nếu chưa gắn)
    title         VARCHAR(500)  NOT NULL,
    slug          VARCHAR(500)  NOT NULL,
    summary       TEXT          NULL,
    content       LONGTEXT      NULL,                       -- nội dung để embed
    thumbnail_url VARCHAR(1000) NULL,
    status        VARCHAR(20)   NOT NULL DEFAULT 'DRAFT',   -- DRAFT | PUBLISHED | ARCHIVED
    published_at  DATETIME      NULL,
    created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id),
    UNIQUE KEY uq_post_slug (slug),
    KEY idx_post_admin (admin_id),
    KEY idx_post_event (event_id),
    KEY idx_post_status (status),
    KEY idx_post_published (published_at),
    FULLTEXT KEY ftx_post (title, summary, content),
    CONSTRAINT fk_post_admin FOREIGN KEY (admin_id) REFERENCES admin (admin_id) ON DELETE RESTRICT,
    CONSTRAINT fk_post_event FOREIGN KEY (event_id) REFERENCES event (event_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tag (
    tag_id      BIGINT       NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL,
    description TEXT         NULL,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tag_id),
    UNIQUE KEY uq_tag_name (name),
    UNIQUE KEY uq_tag_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE post_tag (
    post_id    BIGINT   NOT NULL,
    tag_id     BIGINT   NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, tag_id),
    KEY idx_post_tag_tag (tag_id),
    CONSTRAINT fk_post_tag_post FOREIGN KEY (post_id) REFERENCES post (post_id) ON DELETE CASCADE,
    CONSTRAINT fk_post_tag_tag  FOREIGN KEY (tag_id)  REFERENCES tag (tag_id)   ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- like/bookmark/view/rating + comment lồng (parent_engagement_id tự trỏ)
CREATE TABLE engagement (
    engagement_id        BIGINT      NOT NULL AUTO_INCREMENT,
    member_id            BIGINT      NOT NULL,
    post_id              BIGINT      NOT NULL,
    parent_engagement_id BIGINT      NULL,                  -- reply lồng (NULL = gốc)
    engagement_type      VARCHAR(20) NOT NULL,              -- LIKE | BOOKMARK | VIEW | RATING | COMMENT
    comment_content      TEXT        NULL,
    comment_status       VARCHAR(20) NULL,                  -- VISIBLE | HIDDEN | PENDING
    rating_value         INT         NULL,
    created_at           DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (engagement_id),
    KEY idx_engagement_member (member_id),
    KEY idx_engagement_post (post_id),
    KEY idx_engagement_parent (parent_engagement_id),
    KEY idx_engagement_type (engagement_type),
    CONSTRAINT fk_engagement_member FOREIGN KEY (member_id) REFERENCES member (member_id) ON DELETE CASCADE,
    CONSTRAINT fk_engagement_post   FOREIGN KEY (post_id)   REFERENCES post (post_id)     ON DELETE CASCADE,
    CONSTRAINT fk_engagement_parent FOREIGN KEY (parent_engagement_id) REFERENCES engagement (engagement_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- Bảng cầu M:N lịch sử: event_location, participation
-- ============================================================================
CREATE TABLE event_location (
    event_id      BIGINT      NOT NULL,
    location_id   BIGINT      NOT NULL,
    relation_type VARCHAR(50) NULL,                         -- HAPPENED_AT | CAPITAL | BIRTH_PLACE ...
    created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, location_id),
    KEY idx_event_location_location (location_id),
    CONSTRAINT fk_event_location_event    FOREIGN KEY (event_id)    REFERENCES event (event_id)       ON DELETE CASCADE,
    CONSTRAINT fk_event_location_location FOREIGN KEY (location_id) REFERENCES location (location_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE participation (
    participation_id BIGINT       NOT NULL AUTO_INCREMENT,
    event_id         BIGINT       NOT NULL,
    person_id        BIGINT       NOT NULL,
    `role`           VARCHAR(100) NULL,                     -- KING | GENERAL | WITNESS ...
    note             TEXT         NULL,
    confidence       DECIMAL(3,2) NULL,                     -- 0.00 - 1.00
    created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (participation_id),
    UNIQUE KEY uq_participation (event_id, person_id, `role`),
    KEY idx_participation_person (person_id),
    CONSTRAINT fk_participation_event  FOREIGN KEY (event_id)  REFERENCES event (event_id)   ON DELETE CASCADE,
    CONSTRAINT fk_participation_person FOREIGN KEY (person_id) REFERENCES person (person_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- SOURCE / BẰNG CHỨNG: source + event_source (M:N, có page_number)
-- ============================================================================
CREATE TABLE source (
    source_id         BIGINT        NOT NULL AUTO_INCREMENT,
    title             VARCHAR(500)  NOT NULL,
    source_type       VARCHAR(50)   NOT NULL,               -- BOOK | ARTICLE | PDF | URL | MANUAL
    source_url        VARCHAR(1000) NULL,
    file_path         VARCHAR(1000) NULL,                   -- đường dẫn file PDF gốc (nếu có)
    content           LONGTEXT      NULL,                   -- text đã trích để embed
    author            VARCHAR(255)  NULL,
    publication_year  INT           NULL,
    reliability_level VARCHAR(20)   NULL,                   -- HIGH | MEDIUM | LOW
    created_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (source_id),
    KEY idx_source_type (source_type),
    KEY idx_source_reliability (reliability_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE event_source (
    event_id      BIGINT       NOT NULL,
    source_id     BIGINT       NOT NULL,
    page_number   INT          NULL,                        -- trang chứng minh (citation)
    evidence_text TEXT         NULL,
    confidence    DECIMAL(3,2) NULL,
    note          TEXT         NULL,
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, source_id),
    KEY idx_event_source_source (source_id),
    CONSTRAINT fk_event_source_event  FOREIGN KEY (event_id)  REFERENCES event (event_id)   ON DELETE CASCADE,
    CONSTRAINT fk_event_source_source FOREIGN KEY (source_id) REFERENCES source (source_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- RAG: rag_chunk (POLYMORPHIC — source_id KHÔNG có FK, xử lý xóa ở app)
-- ============================================================================
CREATE TABLE rag_chunk (
    rag_chunk_id    BIGINT       NOT NULL AUTO_INCREMENT,
    source_type     VARCHAR(50)  NOT NULL,                  -- POST | EVENT | PERSON | SOURCE
    source_id       BIGINT       NOT NULL,                  -- id theo source_type (không ràng buộc FK)
    chunk_index     INT          NOT NULL,
    chunk_text      LONGTEXT     NULL,
    qdrant_point_id VARCHAR(64)  NULL,                      -- id điểm trong Qdrant
    content_hash    VARCHAR(64)  NULL,                      -- SHA-256 → biết khi nào re-embed
    metadata_json   JSON         NULL,                      -- payload denorm (page_number, tag_ids, embedding_model...)
    embedded_at     DATETIME     NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (rag_chunk_id),
    UNIQUE KEY uq_rag_chunk (source_type, source_id, chunk_index),
    KEY idx_rag_chunk_source (source_type, source_id),
    KEY idx_rag_chunk_point (qdrant_point_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- CONFIG: system_settings (tham số RAG chỉnh runtime)
-- ============================================================================
CREATE TABLE system_settings (
    setting_id    BIGINT       NOT NULL AUTO_INCREMENT,
    setting_key   VARCHAR(100) NOT NULL,
    setting_value LONGTEXT     NULL,
    description   TEXT         NULL,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (setting_id),
    UNIQUE KEY uq_system_settings_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- Seed: tham số RAG mặc định (Gemini — vector 768 chiều)
-- ============================================================================
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
    ('rag.chunk_size',      '800',                 'Số ký tự mỗi chunk'),
    ('rag.chunk_overlap',   '120',                 'Overlap giữa các chunk'),
    ('rag.top_k',           '5',                   'Số chunk retrieve mỗi câu hỏi'),
    ('rag.embedding_model', 'text-embedding-004',  'Model embedding Gemini (768 chiều)'),
    ('rag.vector_size',     '768',                 'Số chiều vector của collection Qdrant'),
    ('rag.llm_model',       'gemini-2.0-flash',    'Model sinh câu trả lời (Gemini)'),
    ('rag.temperature',     '0.2',                 'Nhiệt độ LLM'),
    ('rag.enable_graph',    'true',                'Bật Graph RAG (Neo4j)');

-- Lưu ý: tạo tài khoản admin đầu tiên qua API/seed riêng (password_hash phải là hash thật, vd BCrypt).

SET FOREIGN_KEY_CHECKS = 1;
