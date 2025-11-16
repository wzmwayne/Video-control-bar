// ==UserScript==
// @name         简化视频控制条
// @namespace    http://tampermonkey.net/
// @version      9.3
// @description  简洁的视频控制条，只保留控制原视频功能
// @author       Assistant
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_download
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_setClipboard
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 添加样式
    GM_addStyle(`
        .touch-video-controls {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(10px);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            z-index: 10000;
            padding: 8px 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: transform 0.3s ease;
            height: 50px;
            box-sizing: border-box;
        }

        .touch-controls-hidden {
            transform: translateY(100%);
        }

        .controls-main {
            display: flex;
            align-items: center;
            flex: 1;
            gap: 8px;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }

        .controls-main::-webkit-scrollbar {
            display: none;
        }

        .touch-icon-button {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s;
            touch-action: manipulation;
            flex-shrink: 0;
        }

        .touch-icon-button:active {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(0.95);
        }

        .progress-container {
            flex: 1;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
            position: relative;
            margin: 0 10px;
            min-width: 60px;
            flex-shrink: 1;
        }

        .progress-bar {
            height: 100%;
            background: #007acc;
            border-radius: 2px;
            width: 0%;
            transition: width 0.1s;
        }

        .volume-container {
            display: flex;
            align-items: center;
            gap: 5px;
            min-width: 80px;
            flex-shrink: 0;
        }

        .volume-slider {
            width: 60px;
            height: 4px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 2px;
            outline: none;
            -webkit-appearance: none;
        }

        .volume-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
        }

        .time-display {
            color: white;
            font-size: 12px;
            min-width: 80px;
            text-align: center;
            flex-shrink: 0;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: background 0.2s;
        }

        .time-display:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .toggle-controls {
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.85);
            border: none;
            border-radius: 8px 8px 0 0;
            color: white;
            width: 40px;
            height: 20px;
            font-size: 12px;
            cursor: pointer;
        }

        /* 时间菜单样式 */
        .time-menu {
            position: absolute;
            bottom: 60px;
            background: rgba(0, 0, 0, 0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 8px;
            z-index: 10001;
            min-width: 150px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .time-menu-item {
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s;
        }

        .time-menu-item:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        /* 锁定状态样式 */
        .lock-btn.locked {
            background: rgba(255, 0, 0, 0.3);
        }

        .lock-notification {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(255, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10001;
            backdrop-filter: blur(10px);
            animation: fadeInOut 2s ease-in-out;
        }

        .lock-notification.success {
            background: rgba(0, 255, 0, 0.8);
        }

        .lock-notification.error {
            background: rgba(255, 0, 0, 0.8);
        }

        .lock-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            z-index: 9999;
            display: none;
        }

        @keyframes fadeInOut {
            0% { opacity: 0; transform: translateY(-10px); }
            20% { opacity: 1; transform: translateY(0); }
            80% { opacity: 1; transform: translateY(0); }
            100% { opacity: 0; transform: translateY(-10px); }
        }

        /* 时间输入框样式 */
        .time-input-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10002;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .time-input-box {
            background: rgba(0, 0, 0, 0.9);
            padding: 20px;
            border-radius: 8px;
            min-width: 300px;
            backdrop-filter: blur(10px);
        }

        .time-input-title {
            color: white;
            margin-bottom: 10px;
            font-size: 14px;
        }

        .time-input-field {
            width: 100%;
            padding: 8px;
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            background: rgba(255, 255, 255, 0.1);
            color: white;
            margin-bottom: 10px;
        }

        .time-input-buttons {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
        }

        .time-input-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }

        .time-input-confirm {
            background: #007acc;
            color: white;
        }

        .time-input-cancel {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }

        @media (max-width: 768px) {
            .touch-video-controls {
                padding: 6px 8px;
                height: 45px;
            }

            .touch-icon-button {
                width: 36px;
                height: 36px;
                font-size: 18px;
            }

            .volume-container {
                min-width: 70px;
            }

            .volume-slider {
                width: 50px;
            }

            .time-display {
                min-width: 70px;
                font-size: 11px;
            }

            .time-menu {
                min-width: 130px;
            }
        }
    `);

    // 全局变量
    let controlPanel = null;
    let currentVideo = null;
    let isInitialized = false;
    let isDragging = false;
    let hideTimeout = null;
    let isControlsHidden = false;
    let isLocked = false;
    let timeMenu = null;

    // 视频状态监控
    let videoState = {
        currentTime: 0,
        volume: 1,
        muted: false,
        paused: true,
        playbackRate: 1
    };

    let videoStateMonitor = null;
    let isRestoringState = false;

    // 原始方法备份
    let originalMethods = {};
    let originalProperties = {};
    let lockOverlay = null;

    // 主初始化函数
    function init() {
        if (isInitialized) return;

        console.log('简化视频控制条脚本开始初始化');

        // 创建锁定覆盖层
        createLockOverlay();

        // 设置轻量级DOM观察器
        const observer = new MutationObserver((mutations) => {
            let hasRelevantChange = false;

            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    hasRelevantChange = true;
                    break;
                }

                if (mutation.type === 'attributes' &&
                    (mutation.attributeName === 'src' || mutation.attributeName === 'class')) {
                    hasRelevantChange = true;
                    break;
                }
            }

            if (hasRelevantChange && !currentVideo) {
                clearTimeout(window.videoCheckTimeout);
                window.videoCheckTimeout = setTimeout(() => {
                    findAndHandleVideos();
                }, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'class', 'id']
        });

        // 初始检查
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(findAndHandleVideos, 1000);
            });
        } else {
            setTimeout(findAndHandleVideos, 1000);
        }

        isInitialized = true;
    }

    // 创建锁定覆盖层
    function createLockOverlay() {
        lockOverlay = document.createElement('div');
        lockOverlay.className = 'lock-overlay';
        lockOverlay.innerHTML = '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:white;font-size:24px;text-align:center;">视频已锁定<br><span style="font-size:16px;">点击解锁按钮解除锁定</span></div>';
        document.body.appendChild(lockOverlay);
    }

    // 查找并处理视频
    function findAndHandleVideos() {
        if (currentVideo) return;

        console.log('查找页面中的视频元素');

        const videos = document.querySelectorAll('video');

        if (videos.length === 0) {
            console.log('未找到视频元素');
            return;
        }

        // 过滤出未处理的视频
        const untreatedVideos = Array.from(videos).filter(video =>
            !video.hasAttribute('data-video-replaced') &&
            (video.src || video.currentSrc || video.querySelector('source'))
        );

        if (untreatedVideos.length === 0) {
            console.log('没有未处理的视频元素');
            return;
        }

        console.log(`找到 ${untreatedVideos.length} 个未处理的视频元素`);

        const video = untreatedVideos[0];
        handleVideoElement(video);
    }

    // 处理视频元素
    function handleVideoElement(video) {
        console.log('处理视频元素');
        currentVideo = video;

        // 隐藏原生控制条
        if (video.controls) {
            video.controls = false;
        }

        video.setAttribute('data-video-replaced', 'true');

        // 检查是否有保存的进度
        checkSavedProgress();

        // 创建控制条
        createControlPanel();

        console.log('视频控制条已启用');
    }

    // 检查保存的进度
    function checkSavedProgress() {
        if (!currentVideo) return;

        const videoKey = getVideoKey();
        const savedProgress = GM_getValue(videoKey, null);

        if (savedProgress && savedProgress > 0) {
            console.log(`发现保存的进度: ${savedProgress}秒`);
            currentVideo.addEventListener('loadedmetadata', function() {
                if (savedProgress < currentVideo.duration) {
                    currentVideo.currentTime = savedProgress;
                    console.log(`已跳转到保存的进度: ${savedProgress}秒`);
                }
            }, { once: true });
        }
    }

    // 获取视频唯一标识
    function getVideoKey() {
        if (!currentVideo) return '';

        const src = currentVideo.src || currentVideo.currentSrc || '';
        const pageUrl = window.location.href;

        return `video_progress_${btoa(src + pageUrl).replace(/[^a-zA-Z0-9]/g, '')}`;
    }

    // 创建控制面板
    function createControlPanel() {
        if (!currentVideo) return;

        // 移除已存在的控制面板
        if (controlPanel) {
            controlPanel.remove();
            controlPanel = null;
        }

        console.log('创建控制面板');

        controlPanel = document.createElement('div');
        controlPanel.className = `touch-video-controls ${isControlsHidden ? 'touch-controls-hidden' : ''}`;

        controlPanel.innerHTML = `
            <button class="toggle-controls">${isControlsHidden ? '⬆️' : '⬇️'}</button>
            <div class="controls-main">
                <button class="touch-icon-button play-pause">⏸️</button>
                <div class="progress-container">
                    <div class="progress-bar"></div>
                </div>
                <div class="time-display">0:00 / 0:00</div>

                <div class="volume-container">
                    <button class="touch-icon-button volume-icon">🔊</button>
                    <input type="range" class="volume-slider" min="0" max="1" step="0.01" value="1">
                </div>

                <button class="touch-icon-button lock-btn">🔒</button>
                <button class="touch-icon-button fullscreen-btn">⛶</button>
            </div>
        `;

        document.body.appendChild(controlPanel);
        setupEventListeners();
        setupAutoHide();

        console.log('控制面板创建完成');
    }

    // 设置事件监听器
    function setupEventListeners() {
        if (!currentVideo || !controlPanel) {
            console.log('设置事件监听器失败：缺少视频或控制面板');
            return;
        }

        console.log('开始设置事件监听器');

        const playPauseBtn = controlPanel.querySelector('.play-pause');
        const progressContainer = controlPanel.querySelector('.progress-container');
        const progressBar = controlPanel.querySelector('.progress-bar');
        const timeDisplay = controlPanel.querySelector('.time-display');
        const volumeIcon = controlPanel.querySelector('.volume-icon');
        const volumeSlider = controlPanel.querySelector('.volume-slider');
        const fullscreenBtn = controlPanel.querySelector('.fullscreen-btn');
        const toggleBtn = controlPanel.querySelector('.toggle-controls');
        const lockBtn = controlPanel.querySelector('.lock-btn');

        // 播放/暂停控制
        playPauseBtn.addEventListener('click', () => {
            if (isLocked) {
                showLockNotification('锁定状态下无法操作');
                return;
            }

            if (currentVideo.paused) {
                currentVideo.play().catch(e => {
                    console.log('播放失败:', e);
                });
                playPauseBtn.textContent = '⏸️';
            } else {
                currentVideo.pause();
                playPauseBtn.textContent = '▶️';
            }
            resetAutoHide();
        });

        // 进度条控制
        progressContainer.addEventListener('click', (e) => {
            if (isLocked) {
                showLockNotification('锁定状态下无法操作');
                return;
            }

            const rect = progressContainer.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            currentVideo.currentTime = currentVideo.duration * percent;
            resetAutoHide();
        });

        // 进度条拖拽
        progressContainer.addEventListener('mousedown', startDrag);
        progressContainer.addEventListener('touchstart', startDrag);

        function startDrag(e) {
            if (isLocked) {
                showLockNotification('锁定状态下无法操作');
                return;
            }

            isDragging = true;
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('touchmove', onDrag);
            document.addEventListener('mouseup', stopDrag);
            document.addEventListener('touchend', stopDrag);
            updateProgress(e);
        }

        function onDrag(e) {
            if (!isDragging) return;
            updateProgress(e);
        }

        function stopDrag() {
            isDragging = false;
            document.removeEventListener('mousemove', onDrag);
            document.removeEventListener('touchmove', onDrag);
            document.removeEventListener('mouseup', stopDrag);
            document.removeEventListener('touchend', stopDrag);
        }

        function updateProgress(e) {
            const rect = progressContainer.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            let percent = (clientX - rect.left) / rect.width;
            percent = Math.max(0, Math.min(1, percent));
            currentVideo.currentTime = currentVideo.duration * percent;
        }

        // 音量控制
        volumeSlider.addEventListener('input', () => {
            if (isLocked) {
                showLockNotification('锁定状态下无法操作');
                volumeSlider.value = currentVideo.volume; // 恢复原值
                return;
            }

            currentVideo.volume = volumeSlider.value;
            updateVolumeIcon();
        });

        volumeIcon.addEventListener('click', () => {
            if (isLocked) {
                showLockNotification('锁定状态下无法操作');
                return;
            }

            currentVideo.muted = !currentVideo.muted;
            if (currentVideo.muted) {
                volumeSlider.value = 0;
            } else {
                volumeSlider.value = currentVideo.volume;
            }
            updateVolumeIcon();
            resetAutoHide();
        });

        // 更新音量图标
        function updateVolumeIcon() {
            if (currentVideo.muted || currentVideo.volume === 0) {
                volumeIcon.textContent = '🔇';
            } else if (currentVideo.volume < 0.3) {
                volumeIcon.textContent = '🔈';
            } else if (currentVideo.volume < 0.7) {
                volumeIcon.textContent = '🔉';
            } else {
                volumeIcon.textContent = '🔊';
            }
        }

        // 初始化音量
        volumeSlider.value = currentVideo.volume;
        updateVolumeIcon();

        // 锁定按钮
        lockBtn.addEventListener('click', () => {
            isLocked = !isLocked;

            if (isLocked) {
                lockBtn.textContent = '🔓';
                lockBtn.classList.add('locked');
                enforceVideoLock();
                showLockNotification('视频已强制锁定 - 所有操作被阻止');
            } else {
                lockBtn.textContent = '🔒';
                lockBtn.classList.remove('locked');
                releaseVideoLock();
                showLockNotification('视频已解锁', 'success');
            }
        });

        // 全屏控制
        fullscreenBtn.addEventListener('click', () => {
            if (isLocked) {
                showLockNotification('锁定状态下无法操作');
                return;
            }

            if (document.fullscreenElement) {
                document.exitFullscreen();
                fullscreenBtn.textContent = '⛶';
            } else {
                if (currentVideo.requestFullscreen) {
                    currentVideo.requestFullscreen().catch(err => {
                        console.log('全屏请求失败:', err);
                    });
                    fullscreenBtn.textContent = '⛷';
                }
            }
            resetAutoHide();
        });

        // 收起/展开控制
        toggleBtn.addEventListener('click', () => {
            isControlsHidden = !isControlsHidden;
            controlPanel.classList.toggle('touch-controls-hidden');
            toggleBtn.textContent = isControlsHidden ? '⬆️' : '⬇️';
        });

        // 时间显示菜单
        timeDisplay.addEventListener('click', (e) => {
            if (isLocked) {
                showLockNotification('锁定状态下无法操作');
                return;
            }

            e.stopPropagation();
            showTimeMenu(e);
        });

        // 更新进度显示
        currentVideo.addEventListener('timeupdate', () => {
            if (!isDragging && !isLocked) {
                const percent = (currentVideo.currentTime / currentVideo.duration) * 100 || 0;
                progressBar.style.width = percent + '%';

                const currentTime = formatTime(currentVideo.currentTime);
                const duration = formatTime(currentVideo.duration);
                timeDisplay.textContent = `${currentTime} / ${duration}`;
            }
        });

        // 视频加载完成后的初始化
        currentVideo.addEventListener('loadedmetadata', () => {
            playPauseBtn.textContent = currentVideo.paused ? '▶️' : '⏸️';
            timeDisplay.textContent = `0:00 / ${formatTime(currentVideo.duration)}`;
        });

        // 播放状态变化
        currentVideo.addEventListener('play', () => {
            if (!isLocked) {
                playPauseBtn.textContent = '⏸️';
            }
        });

        currentVideo.addEventListener('pause', () => {
            if (!isLocked) {
                playPauseBtn.textContent = '▶️';
            }
        });

        currentVideo.addEventListener('volumechange', () => {
            if (!currentVideo.muted && !isLocked) {
                volumeSlider.value = currentVideo.volume;
            }
            updateVolumeIcon();
        });

        // 全屏状态变化
        document.addEventListener('fullscreenchange', () => {
            if (document.fullscreenElement) {
                fullscreenBtn.textContent = '⛷';
            } else {
                fullscreenBtn.textContent = '⛶';
            }
        });

        console.log('事件监听器设置完成');
    }

    // 强制执行视频锁定
    function enforceVideoLock() {
        if (!currentVideo) return;

        console.log('强制执行视频锁定');

        // 保存当前状态
        saveVideoState();

        // 显示锁定覆盖层
        if (lockOverlay) {
            lockOverlay.style.display = 'block';
        }

        // 备份原始方法和属性
        backupOriginalProperties();

        // 重写关键方法
        overrideVideoMethods();

        // 重写关键属性
        overrideVideoProperties();

        // 阻止所有视频事件
        blockVideoEvents();

        // 开始强制监控
        startEnforcedMonitoring();
    }

    // 释放视频锁定
    function releaseVideoLock() {
        if (!currentVideo) return;

        console.log('释放视频锁定');

        // 隐藏锁定覆盖层
        if (lockOverlay) {
            lockOverlay.style.display = 'none';
        }

        // 恢复原始方法和属性
        restoreOriginalProperties();

        // 恢复事件监听
        restoreVideoEvents();

        // 停止强制监控
        stopEnforcedMonitoring();
    }

    // 备份原始属性
    function backupOriginalProperties() {
        if (!currentVideo) return;

        // 备份方法
        originalMethods.play = currentVideo.play;
        originalMethods.pause = currentVideo.pause;
        originalMethods.load = currentVideo.load;

        // 备份属性描述符
        const properties = ['currentTime', 'volume', 'muted', 'playbackRate'];
        properties.forEach(prop => {
            const descriptor = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, prop) ||
                             Object.getOwnPropertyDescriptor(Object.getPrototypeOf(currentVideo), prop);
            if (descriptor) {
                originalProperties[prop] = descriptor;
            }
        });
    }

    // 重写视频方法
    function overrideVideoMethods() {
        if (!currentVideo) return;

        // 重写播放方法
        currentVideo.play = function() {
            console.log('播放请求被阻止 - 视频已锁定');
            showLockNotification('播放被阻止 - 视频已锁定', 'error');
            return Promise.reject(new Error('视频已锁定'));
        };

        // 重写暂停方法
        currentVideo.pause = function() {
            console.log('暂停请求被阻止 - 视频已锁定');
            showLockNotification('暂停被阻止 - 视频已锁定', 'error');
        };

        // 重写加载方法
        currentVideo.load = function() {
            console.log('加载请求被阻止 - 视频已锁定');
            showLockNotification('加载被阻止 - 视频已锁定', 'error');
        };
    }

    // 重写视频属性
    function overrideVideoProperties() {
        if (!currentVideo) return;

        // 重写当前时间属性
        Object.defineProperty(currentVideo, 'currentTime', {
            get: function() {
                return videoState.currentTime;
            },
            set: function(value) {
                console.log('currentTime 修改被阻止 - 视频已锁定');
                showLockNotification(`进度跳转被阻止: ${formatTime(value)}`, 'error');
                // 强制恢复原值
                if (originalProperties.currentTime && originalProperties.currentTime.set) {
                    originalProperties.currentTime.set.call(currentVideo, videoState.currentTime);
                }
            },
            configurable: true
        });

        // 重写音量属性
        Object.defineProperty(currentVideo, 'volume', {
            get: function() {
                return videoState.volume;
            },
            set: function(value) {
                console.log('volume 修改被阻止 - 视频已锁定');
                showLockNotification(`音量调整被阻止: ${Math.round(value * 100)}%`, 'error');
                // 强制恢复原值
                if (originalProperties.volume && originalProperties.volume.set) {
                    originalProperties.volume.set.call(currentVideo, videoState.volume);
                }
            },
            configurable: true
        });

        // 重写静音属性
        Object.defineProperty(currentVideo, 'muted', {
            get: function() {
                return videoState.muted;
            },
            set: function(value) {
                console.log('muted 修改被阻止 - 视频已锁定');
                showLockNotification(`静音设置被阻止: ${value ? '静音' : '取消静音'}`, 'error');
                // 强制恢复原值
                if (originalProperties.muted && originalProperties.muted.set) {
                    originalProperties.muted.set.call(currentVideo, videoState.muted);
                }
            },
            configurable: true
        });

        // 重写播放速度属性
        Object.defineProperty(currentVideo, 'playbackRate', {
            get: function() {
                return videoState.playbackRate;
            },
            set: function(value) {
                console.log('playbackRate 修改被阻止 - 视频已锁定');
                showLockNotification(`播放速度被阻止: ${value}x`, 'error');
                // 强制恢复原值
                if (originalProperties.playbackRate && originalProperties.playbackRate.set) {
                    originalProperties.playbackRate.set.call(currentVideo, videoState.playbackRate);
                }
            },
            configurable: true
        });
    }

    // 阻止视频事件
    function blockVideoEvents() {
        if (!currentVideo) return;

        // 阻止所有可能修改视频的事件
        const events = ['click', 'dblclick', 'contextmenu', 'keydown', 'keypress', 'keyup',
                       'mousedown', 'mouseup', 'touchstart', 'touchend', 'touchmove'];

        events.forEach(eventType => {
            currentVideo.addEventListener(eventType, function(e) {
                if (isLocked) {
                    e.stopPropagation();
                    e.preventDefault();
                    console.log(`视频事件被阻止: ${eventType}`);
                }
            }, true); // 使用捕获阶段以确保最先处理
        });
    }

    // 恢复原始属性
    function restoreOriginalProperties() {
        if (!currentVideo) return;

        // 恢复方法
        if (originalMethods.play) currentVideo.play = originalMethods.play;
        if (originalMethods.pause) currentVideo.pause = originalMethods.pause;
        if (originalMethods.load) currentVideo.load = originalMethods.load;

        // 恢复属性
        const properties = ['currentTime', 'volume', 'muted', 'playbackRate'];
        properties.forEach(prop => {
            if (originalProperties[prop]) {
                Object.defineProperty(currentVideo, prop, originalProperties[prop]);
            }
        });
    }

    // 恢复视频事件
    function restoreVideoEvents() {
        // 不需要特别处理，因为事件监听器会在解锁后自然失效
    }

    // 开始强制监控
    function startEnforcedMonitoring() {
        videoStateMonitor = setInterval(() => {
            if (isLocked && !isRestoringState) {
                enforceVideoState();
            }
        }, 50); // 每50毫秒强制执行一次
    }

    // 停止强制监控
    function stopEnforcedMonitoring() {
        if (videoStateMonitor) {
            clearInterval(videoStateMonitor);
            videoStateMonitor = null;
        }
    }

    // 强制执行视频状态
    function enforceVideoState() {
        if (!currentVideo || isRestoringState) return;

        isRestoringState = true;

        // 强制恢复所有状态
        try {
            // 强制恢复播放状态
            if (videoState.paused !== currentVideo.paused) {
                if (videoState.paused && !currentVideo.paused) {
                    originalMethods.pause.call(currentVideo);
                } else if (!videoState.paused && currentVideo.paused) {
                    originalMethods.play.call(currentVideo).catch(() => {});
                }
            }

            // 强制恢复当前时间（使用原始setter）
            if (Math.abs(currentVideo.currentTime - videoState.currentTime) > 0.1) {
                if (originalProperties.currentTime && originalProperties.currentTime.set) {
                    originalProperties.currentTime.set.call(currentVideo, videoState.currentTime);
                }
            }

            // 强制恢复音量
            if (Math.abs(currentVideo.volume - videoState.volume) > 0.01) {
                if (originalProperties.volume && originalProperties.volume.set) {
                    originalProperties.volume.set.call(currentVideo, videoState.volume);
                }
            }

            // 强制恢复静音状态
            if (currentVideo.muted !== videoState.muted) {
                if (originalProperties.muted && originalProperties.muted.set) {
                    originalProperties.muted.set.call(currentVideo, videoState.muted);
                }
            }

            // 强制恢复播放速度
            if (Math.abs(currentVideo.playbackRate - videoState.playbackRate) > 0.01) {
                if (originalProperties.playbackRate && originalProperties.playbackRate.set) {
                    originalProperties.playbackRate.set.call(currentVideo, videoState.playbackRate);
                }
            }

        } catch (e) {
            console.error('强制执行视频状态时出错:', e);
        }

        isRestoringState = false;
    }

    // 保存当前视频状态
    function saveVideoState() {
        if (!currentVideo) return;

        videoState = {
            currentTime: currentVideo.currentTime,
            volume: currentVideo.volume,
            muted: currentVideo.muted,
            paused: currentVideo.paused,
            playbackRate: currentVideo.playbackRate
        };

        console.log('保存视频状态:', videoState);
    }

    // 显示时间菜单
    function showTimeMenu(e) {
        // 移除已存在的菜单
        if (timeMenu) {
            timeMenu.remove();
        }

        timeMenu = document.createElement('div');
        timeMenu.className = 'time-menu';
        timeMenu.innerHTML = `
            <div class="time-menu-item" data-action="save">💾 保存进度</div>
            <div class="time-menu-item" data-action="jump">⏩ 输入时间跳转</div>
            <div class="time-menu-item" data-action="copy">📋 复制时间</div>
        `;

        const rect = e.target.getBoundingClientRect();
        timeMenu.style.left = (rect.left - 60) + 'px';
        timeMenu.style.bottom = (window.innerHeight - rect.top + 10) + 'px';

        document.body.appendChild(timeMenu);

        // 菜单项点击事件
        timeMenu.querySelectorAll('.time-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                handleTimeMenuAction(item.dataset.action);
                timeMenu.remove();
                timeMenu = null;
            });
        });

        // 点击其他地方关闭菜单
        const closeMenu = (e) => {
            if (timeMenu && !timeMenu.contains(e.target) && e.target !== timeDisplay) {
                timeMenu.remove();
                timeMenu = null;
                document.removeEventListener('click', closeMenu);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    // 处理时间菜单动作
    function handleTimeMenuAction(action) {
        switch (action) {
            case 'save':
                saveProgress();
                break;
            case 'jump':
                showTimeInput();
                break;
            case 'copy':
                copyTime();
                break;
        }
    }

    // 保存进度
    function saveProgress() {
        if (!currentVideo) return;

        const videoKey = getVideoKey();
        const currentTime = currentVideo.currentTime;

        GM_setValue(videoKey, currentTime);

        showLockNotification(`进度已保存: ${formatTime(currentTime)}`, 'success');
        console.log(`进度保存成功: ${currentTime}秒`);
    }

    // 显示时间输入框
    function showTimeInput() {
        const overlay = document.createElement('div');
        overlay.className = 'time-input-overlay';

        overlay.innerHTML = `
            <div class="time-input-box">
                <div class="time-input-title">输入时间跳转 (格式: 分:秒 或 秒)</div>
                <input type="text" class="time-input-field" placeholder="例如: 1:30 或 90">
                <div class="time-input-buttons">
                    <button class="time-input-btn time-input-cancel">取消</button>
                    <button class="time-input-btn time-input-confirm">跳转</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const input = overlay.querySelector('.time-input-field');
        const cancelBtn = overlay.querySelector('.time-input-cancel');
        const confirmBtn = overlay.querySelector('.time-input-confirm');

        input.focus();

        // 确认跳转
        confirmBtn.addEventListener('click', () => {
            const timeStr = input.value.trim();
            if (timeStr) {
                const timeInSeconds = parseTimeString(timeStr);
                if (timeInSeconds !== null && timeInSeconds <= currentVideo.duration) {
                    currentVideo.currentTime = timeInSeconds;
                    overlay.remove();
                } else {
                    showLockNotification('时间格式错误或超出视频长度', 'error');
                }
            }
        });

        // 取消
        cancelBtn.addEventListener('click', () => {
            overlay.remove();
        });

        // 点击 overlay 关闭
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        // 回车确认
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                confirmBtn.click();
            }
        });
    }

    // 解析时间字符串
    function parseTimeString(timeStr) {
        // 格式1: 分:秒 (如 1:30)
        if (timeStr.includes(':')) {
            const parts = timeStr.split(':');
            if (parts.length === 2) {
                const minutes = parseInt(parts[0]);
                const seconds = parseInt(parts[1]);
                if (!isNaN(minutes) && !isNaN(seconds)) {
                    return minutes * 60 + seconds;
                }
            }
        }

        // 格式2: 纯秒数 (如 90)
        const seconds = parseInt(timeStr);
        if (!isNaN(seconds)) {
            return seconds;
        }

        return null;
    }

    // 复制时间
    function copyTime() {
        if (!currentVideo) return;

        const currentTime = formatTime(currentVideo.currentTime);
        const duration = formatTime(currentVideo.duration);
        const timeText = `${currentTime} / ${duration}`;

        if (typeof GM_setClipboard !== 'undefined') {
            GM_setClipboard(timeText);
            showLockNotification('时间已复制到剪贴板', 'success');
        } else {
            // 备用方案
            navigator.clipboard.writeText(timeText).then(() => {
                showLockNotification('时间已复制到剪贴板', 'success');
            }).catch(() => {
                showLockNotification('复制失败', 'error');
            });
        }
    }

    // 显示锁定通知
    function showLockNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `lock-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }

    // 格式化时间
    function formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function setupAutoHide() {
        if (!controlPanel) return;

        controlPanel.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
        });

        controlPanel.addEventListener('mouseleave', () => {
            startAutoHide();
        });

        controlPanel.addEventListener('touchstart', resetAutoHide);
    }

    function resetAutoHide() {
        clearTimeout(hideTimeout);
        if (!isControlsHidden) {
            hideTimeout = setTimeout(() => {
                if (controlPanel && !controlPanel.matches(':hover')) {
                    controlPanel.classList.add('touch-controls-hidden');
                    isControlsHidden = true;
                    controlPanel.querySelector('.toggle-controls').textContent = '⬆️';
                }
            }, 3000);
        }
    }

    function startAutoHide() {
        if (!isControlsHidden) {
            hideTimeout = setTimeout(() => {
                controlPanel.classList.add('touch-controls-hidden');
                isControlsHidden = true;
                controlPanel.querySelector('.toggle-controls').textContent = '⬆️';
            }, 3000);
        }
    }

    // 初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();