# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.1] - 2026-10-19

### Changed
- CI publishes the container image to GHCR on every tag: the server pulls a
  ready image instead of building from source.

## [1.0.0] - 2026-10-19

First release.

### Added
- Headless Chromium in a single container, reachable over the Playwright Server
  WebSocket protocol.
- Healthcheck that opens a real page instead of probing a port.
- Self-restart after a configurable number of consecutive healthcheck failures.
- Explicit shared-memory size, PID and memory limits.
