
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(20)  NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password      VARCHAR(255) NOT NULL,
  name          VARCHAR(100) NOT NULL,
  role          ENUM('fan','driver','admin') NOT NULL DEFAULT 'fan',
  avatar        VARCHAR(5)   NOT NULL DEFAULT '',
  avatar_color  VARCHAR(20)  NOT NULL DEFAULT '#888888',
  bio           TEXT,
  number        INT          NULL,
  team          VARCHAR(100) NULL,
  nationality   VARCHAR(100) NULL,
  followers     INT          NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  user_id            INT          NOT NULL,
  username           VARCHAR(20)  NOT NULL,
  author_name        VARCHAR(100) NOT NULL,
  author_avatar      VARCHAR(5)   NOT NULL DEFAULT '',
  author_avatar_color VARCHAR(20) NOT NULL DEFAULT '#888888',
  author_role        ENUM('fan','driver','admin') NOT NULL DEFAULT 'fan',
  content            TEXT         NOT NULL,
  status             ENUM('pending','approved') NOT NULL DEFAULT 'pending',
  likes              INT NOT NULL DEFAULT 0,
  dislikes           INT NOT NULL DEFAULT 0,
  comment_count      INT NOT NULL DEFAULT 0,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comments (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  post_id             INT          NOT NULL,
  user_id             INT          NOT NULL,
  username            VARCHAR(20)  NOT NULL,
  author_name         VARCHAR(100) NOT NULL,
  author_avatar       VARCHAR(5)   NOT NULL DEFAULT '',
  author_avatar_color VARCHAR(20)  NOT NULL DEFAULT '#888888',
  content             TEXT         NOT NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id)  REFERENCES posts(id)  ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS likes (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  post_id    INT  NOT NULL,
  user_id    INT  NOT NULL,
  type       ENUM('like','dislike') NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_vote (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id)  ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS follows (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  follower_id  INT NOT NULL,
  following_id INT NOT NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_follow (follower_id, following_id),
  FOREIGN KEY (follower_id)  REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS live_discussions (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  created_by VARCHAR(20)  NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS live_messages (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  discussion_id       INT          NOT NULL,
  user_id             INT          NOT NULL,
  username            VARCHAR(20)  NOT NULL,
  author_name         VARCHAR(100) NOT NULL,
  author_avatar       VARCHAR(5)   NOT NULL DEFAULT '',
  author_avatar_color VARCHAR(20)  NOT NULL DEFAULT '#888888',
  author_role         ENUM('fan','driver','admin') NOT NULL DEFAULT 'fan',
  content             TEXT         NOT NULL,
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (discussion_id) REFERENCES live_discussions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)       REFERENCES users(id)            ON DELETE CASCADE
);
