# Changelog

All notable changes to this project are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.4] - 2026-11-24

### Fixed
- Updated Playwright to 1.65.1 to address the `Assertion error` in
  `_CRSession._onMessage` that caused the server process to exit on client
  disconnects.

## [1.0.3] - 2026-11-23

### Fixed
- Healthcheck no longer sends SIGTERM to PID 1 by default. Self-restart is now
  opt-in via `HC_KILL_AFTER`; a transient probe failure cannot restart a working
  server.

### Changed
- `HC_KILL_AFTER` now defaults to `0` (disabled).

## [1.0.2] - 2026-10-19

### Changed
- Release workflow runs a syntax check before building the image and creates
  the GitHub release from this changelog.

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
