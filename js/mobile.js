/**
 * 手机端适配
 * 1. 双击触发原版 toggleOverview
 * 2. overview 模式下，用 JS 设置 section margin-top
 *    保持原版心形模式(2/3/7/8上移，5下移)，用 vh 替代 %
 */
(function() {
    var _lastTap = 0;
    var _tapTimeout = 300;
    var _applied = false;

    function isMobilePortrait() {
        var w = window.innerWidth || document.documentElement.clientWidth;
        var h = window.innerHeight || document.documentElement.clientHeight;
        return w < 768 && h > w;
    }

    function init() {
        if (!('ontouchstart' in document.documentElement)) return;
        if (!isMobilePortrait()) return;
        if (!window.Flowtime || !Flowtime.toggleOverview) return;
        if (init._done) return;
        init._done = true;

        document.addEventListener('touchend', function(e) {
            var now = Date.now();
            var diff = now - _lastTap;

            if (diff < _tapTimeout && diff > 0) {
                e.preventDefault();
                e.stopPropagation();
                var wasOverview = document.body.classList.contains('ft-overview');
                Flowtime.toggleOverview(true);
                _lastTap = 0;

                if (!wasOverview) {
                    setTimeout(applyHeart, 550);
                } else {
                    removeHeart();
                }
            } else {
                _lastTap = now;
            }
        }, true);
    }

    function applyHeart() {
        if (_applied) return;
        _applied = true;

        var sections = document.querySelectorAll('.ft-section');
        if (sections.length === 0) return;

        // 原版心形模式：2/3/7/8 上移，5 下移，1/4/6/9 不变
        // 用 vh 让偏移在竖屏下更明显
        var margins = [
            '15vh',   // section-1: 中等下移
            '-5vh',   // section-2: 略上移
            '-25vh',  // section-3: 大幅上移（圆弧顶部）
            '10vh',   // section-4: 下移（凹陷）
            '35vh',   // section-5: 大幅下移（底部尖端）
            '10vh',   // section-6: 下移（凹陷）
            '-25vh',  // section-7: 大幅上移（圆弧顶部）
            '-5vh',   // section-8: 略上移
            '15vh'    // section-9: 中等下移
        ];

        for (var i = 0; i < sections.length && i < margins.length; i++) {
            sections[i].style.setProperty('margin-top', margins[i], 'important');
        }
    }

    function removeHeart() {
        if (!_applied) return;
        _applied = false;

        var sections = document.querySelectorAll('.ft-section');
        for (var i = 0; i < sections.length; i++) {
            sections[i].style.removeProperty('margin-top');
        }
    }

    if (document.readyState === 'complete') {
        setTimeout(init, 500);
    } else {
        window.addEventListener('load', function() {
            setTimeout(init, 500);
        });
    }

    var tryCount = 0;
    var t = setInterval(function() {
        tryCount++;
        init();
        if (tryCount > 60) clearInterval(t);
    }, 200);
})();
