-- Clear all posts and messages while preserving user accounts
-- Run this in your Snowflake environment

USE DATABASE HOMESAFELY;
USE SCHEMA PUBLIC;

-- Delete all messages
DELETE FROM MESSAGES;

-- Delete all posts
DELETE FROM POSTS;

-- Delete all connections (optional)
DELETE FROM CONNECTIONS;

-- Verify the tables are empty
SELECT COUNT(*) as POSTS_COUNT FROM POSTS;
SELECT COUNT(*) as MESSAGES_COUNT FROM MESSAGES;
SELECT COUNT(*) as CONNECTIONS_COUNT FROM CONNECTIONS;
