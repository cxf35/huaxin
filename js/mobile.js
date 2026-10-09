/**
 * 手机端适配
 * 1. 双击进入/退出 overview
 * 2. overview 中：55 张缩略图围成爱心轮廓（心形线参数方程），
 *    按住/滑动缩略图 → 屏幕中间放大预览（非全屏），松手 → 全屏显示该页
 */
(function() {
    var _lastTap = 0;
    var _tapTimeout = 300;
    var _applied = false;
    var _resetting = false;
    var _heart = null;       // 爱心布局数据 { pts, gw, gh, scale }
    var _preview = null;     // 当前预览页
    var _touchStartTime = 0;
    var _singleTimer = null;

    function isMobilePortrait() {
        var w = window.innerWidth || document.documentElement.clientWidth;
        var h = window.innerHeight || document.documentElement.clientHeight;
        return w < 768 && h > w;
    }

    // 点在多边形内（射线法）
    function inPolygon(px, py, poly) {
        var inside = false;
        for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            var xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
            if (((yi > py) != (yj > py)) &&
                (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    // 求爱心轮廓在某个 y 处的 x 区间列表（与水平线求交后成对分段）
    // 顶部行会有两段（左 lobe、右 lobe，中间 V 凹陷保持空心）
    function heartXRanges(y, raw) {
        var xs = [];
        for (var i = 0; i < raw.length; i++) {
            var a = raw[i], b = raw[(i + 1) % raw.length];
            if ((a.y > y) != (b.y > y)) {
                xs.push((b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x);
            }
        }
        xs.sort(function(a, b) { return a - b; });
        var ranges = [];
        for (var j = 0; j + 1 < xs.length; j += 2) {
            ranges.push({ min: xs[j], max: xs[j + 1] });
        }
        return ranges;
    }

    /**
     * 生成 55 个点：逐行贴图填充爱心（9:16 竖图 → x 间距 = 图宽、y 行距 = 图高）
     * 每行按该行爱心宽度放图（图贴图，上下不挤、左右不空）
     * 超过 55 张时：从图最多的行末尾去点并重新等分该行，保证每行右缘始终贴满（不出现空位）
     */
    function heartPoints(n, cx, cy, targetW, targetH) {
        var sx = targetW / 32;
        var sy = targetH / 28.5;
        var N = 360;
        var raw = [];
        for (var i = 0; i <= N; i++) {
            var t = (i / N) * 2 * Math.PI;
            var x = 16 * Math.pow(Math.sin(t), 3);
            var y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            raw.push({ x: x, y: y });
        }
        // 图宽（单位）≈ 26px；图高（单位）按 9:16 比例
        var gwU = 2.4;
        var ghU = gwU * 844 / 390;
        var rowList = [];   // 每行 { gy, segs:[{min,max,count}], total }
        // 行距迭代：逐步收紧行距直到总点数 ≥ n（保证 55 张全覆盖爱心）
        for (var attempt = 0; attempt < 14 && rowTotal(rowList) < n; attempt++) {
            rowList = [];
            for (var gy = 11; gy >= -17; gy -= ghU) {
                var ranges = heartXRanges(gy, raw);
                if (!ranges.length) continue;
                var row = { gy: gy, segs: [], total: 0 };
                for (var s = 0; s < ranges.length; s++) {
                    var seg = ranges[s];
                    var cnt = Math.max(1, Math.round((seg.max - seg.min) / gwU));
                    row.segs.push({ min: seg.min, max: seg.max, count: cnt });
                    row.total += cnt;
                }
                rowList.push(row);
            }
            if (rowTotal(rowList) < n) ghU -= 0.25;
        }
        // 超过 n 时：从图最多的行末尾去点（每行去 0-1 个，重新等分该行保持右缘贴满）
        var excess = rowTotal(rowList) - n;
        while (excess > 0) {
            var best = -1;
            for (var r = 0; r < rowList.length; r++) {
                if (rowList[r].total > 1 && (best < 0 || rowList[r].total > rowList[best].total)) best = r;
            }
            if (best < 0) break;
            var segBest = -1;
            for (var s = 0; s < rowList[best].segs.length; s++) {
                var sg = rowList[best].segs[s];
                if (sg.count > 1 && (segBest < 0 || sg.count > rowList[best].segs[segBest].count)) segBest = s;
            }
            if (segBest < 0) break;
            rowList[best].segs[segBest].count--;
            rowList[best].total--;
            excess--;
        }
        // 生成点：每行每段用剩余 count 等分（右缘贴满）
        var pts = [];
        for (var r = 0; r < rowList.length; r++) {
            var row = rowList[r];
            for (var s = 0; s < row.segs.length; s++) {
                var seg = row.segs[s];
                var cnt = seg.count;
                var segW = seg.max - seg.min;
                for (var c = 0; c < cnt; c++) {
                    var gx = seg.min + (c + 0.5) * segW / cnt;
                    pts.push({ left: Math.round(cx + gx * sx), top: Math.round(cy - row.gy * sy) });
                }
            }
        }
        return pts;
    }

    function rowTotal(rowList) {
        var t = 0;
        for (var r = 0; r < rowList.length; r++) t += rowList[r].total;
        return t;
    }

    function pageAt(x, y) {
        // 坐标直接检测缩略图区域（跳过预览页，实现穿透：
        // 放大的缩略图不会挡住手指选中它后面的缩略图）
        if (!_heart || !_heart.rects) return null;
        var rects = _heart.rects;
        var pages = _heart.pages;
        var hit = null;
        for (var i = 0; i < rects.length; i++) {
            if (pages[i] === _preview) continue;
            var r = rects[i];
            if (x >= r.l && x <= r.r && y >= r.t && y <= r.b) {
                hit = pages[i];   // 取最后命中的（DOM 顺序最上层）
            }
        }
        return hit;
    }

    // 判断坐标是否在爱心范围（外接矩形 + 边距）；移到爱心外（灰色区域）松手不进入全屏
    function nearHeart(x, y) {
        if (!_heart || !_heart.pts) return false;
        var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
        for (var i = 0; i < _heart.pts.length; i++) {
            var p = _heart.pts[i];
            if (p.left < minX) minX = p.left;
            if (p.left > maxX) maxX = p.left;
            if (p.top < minY) minY = p.top;
            if (p.top > maxY) maxY = p.top;
        }
        var m = 34;   // 爱心外接矩形边距（半图宽 + 余量）
        return x >= minX - m && x <= maxX + m && y >= minY - m && y <= maxY + m;
    }

    function applyHeart() {
        if (_applied) return;
        _applied = true;
        var pages = document.querySelectorAll('.ft-page');
        if (pages.length === 0) return;

        // 清掉影响 fixed 定位的 transform（.ft-section 有 translateZ(0)）
        var ft = document.querySelector('.flowtime');
        if (ft) ft.style.transform = 'none';
        var sections = document.querySelectorAll('.ft-section');
        for (var si = 0; si < sections.length; si++) {
            sections[si].style.setProperty('transform', 'none', 'important');
        }
        // 注入瞬间隐藏原生网格的样式（防止双击进入时闪现原先排列）
        if (!document.getElementById('_heart-entering-style')) {
            var _st = document.createElement('style');
            _st.id = '_heart-entering-style';
            _st.textContent = '.ft-overview._heart-entering .ft-page{visibility:hidden !important}';
            document.head.appendChild(_st);
        }

        var w = window.innerWidth, h = window.innerHeight;
        var targetW = Math.min(w - 40, 350);      // 爱心宽
        var targetH = Math.min(h - 60, 400);      // 爱心高（屏幕中间，上下留白）
        var cx = Math.round(w / 2);
        var cy = Math.round(h / 2) + 5;
        var pts = heartPoints(pages.length, cx, cy, targetW, targetH);
        // 分散重叠点：间距 < 8px 的点对沿连线推开，完全重合的点错开，避免缩略图相互遮挡
        for (var iter = 0; iter < 4; iter++) {
            var moved = false;
            for (var i = 0; i < pts.length; i++) {
                for (var j = i + 1; j < pts.length; j++) {
                    var dx = pts[j].left - pts[i].left;
                    var dy = pts[j].top - pts[i].top;
                    var d = Math.sqrt(dx * dx + dy * dy);
                    if (d === 0) {
                        pts[j].left += 7;
                        pts[j].top -= 5;
                        moved = true;
                    } else if (d < 8) {
                        var push = (8 - d) / 2;
                        var nx = dx / d * push, ny = dy / d * push;
                        pts[i].left -= Math.round(nx);
                        pts[i].top -= Math.round(ny);
                        pts[j].left += Math.round(nx);
                        pts[j].top += Math.round(ny);
                        moved = true;
                    }
                }
            }
            if (!moved) break;
        }
        var gw = 26;                              // 缩略图宽（9:16 竖图）
        var scale = gw / 390;                     // 内容等比缩放
        var gh = Math.round(844 * scale);         // 缩略图高（9:16）
        var rects = [];
        _heart = {
            pts: pts, gw: gw, gh: gh, scale: scale,
            pages: Array.prototype.slice.call(pages), rects: rects
        };

        for (var i = 0; i < pages.length; i++) {
            var pg = pages[i];
            var pt = pts[i];
            var left = Math.round(pt.left - gw / 2);
            var top = Math.round(pt.top - gh / 2);
            rects.push({ l: left, t: top, r: left + gw, b: top + gh });
            pg.style.position = 'fixed';
            pg.style.left = left + 'px';
            pg.style.top = top + 'px';
            pg.style.margin = '0';
            pg.style.padding = '0';
            pg.style.overflow = 'hidden';
            pg.style.zIndex = '10';
            pg.style.visibility = 'visible';
            pg.style.setProperty('transition', 'none', 'important');   // 瞬间就位，不播放网格动画
            pg.style.removeProperty('pointer-events');
            pg.style.setProperty('transform', 'scale(' + scale + ')', 'important');
            pg.style.setProperty('transform-origin', '0 0', 'important');
        }
    }

    function restoreToHeart(pg) {
        if (!_heart) return;
        var pages = document.querySelectorAll('.ft-page');
        var idx = -1;
        for (var i = 0; i < pages.length; i++) {
            if (pages[i] === pg) { idx = i; break; }
        }
        if (idx < 0) return;
        var pt = _heart.pts[idx];
        // 开启过渡：从预览大图平滑缩回爱心小图
        pg.style.setProperty('transition', 'left .3s ease, top .3s ease, transform .3s ease', 'important');
        pg.style.left = Math.round(pt.left - _heart.gw / 2) + 'px';
        pg.style.top = Math.round(pt.top - _heart.gh / 2) + 'px';
        pg.style.zIndex = '10';
        pg.style.removeProperty('pointer-events');
        pg.style.setProperty('transform', 'scale(' + _heart.scale + ')', 'important');
        pg.style.setProperty('transform-origin', '0 0', 'important');
    }

    function previewPage(pg) {
        if (!pg) return;
        if (_preview && _preview !== pg) restoreToHeart(_preview);
        _preview = pg;
        var w = window.innerWidth, h = window.innerHeight;
        var pw = Math.round(w * 0.72);            // 预览宽（屏幕中间，非全屏）
        var pScale = pw / 390;
        var ph = Math.round(844 * pScale);
        // 开启过渡：从爱心小图平滑放大到屏幕中间预览
        pg.style.setProperty('transition', 'left .3s ease, top .3s ease, transform .3s ease', 'important');
        pg.style.left = Math.round((w - pw) / 2) + 'px';
        pg.style.top = Math.round((h - ph) / 2) + 'px';
        pg.style.zIndex = '100';
        pg.style.pointerEvents = 'none';          // 不挡手指滑动选择其他缩略图
        pg.style.setProperty('transform', 'scale(' + pScale + ')', 'important');
        pg.style.setProperty('transform-origin', '0 0', 'important');
    }

    function clearPreview() {
        if (_preview) {
            restoreToHeart(_preview);
            _preview = null;
        }
    }

    function gotoPreviewPage() {
        if (!_preview) return;
        var pg = _preview;
        _preview = null;
        if (window.Flowtime && pg.parentNode) {
            Flowtime.gotoPage(pg.parentNode.index, pg.index);
        }
    }

    function removeHeart() {
        if (!_applied) return;
        _applied = false;
        _preview = null;
        _heart = null;
        var pages = document.querySelectorAll('.ft-page');
        for (var i = 0; i < pages.length; i++) {
            var p = pages[i];
            p.style.removeProperty('position');
            p.style.removeProperty('width');
            p.style.removeProperty('height');
            p.style.removeProperty('left');
            p.style.removeProperty('top');
            p.style.removeProperty('margin');
            p.style.removeProperty('padding');
            p.style.removeProperty('overflow');
            p.style.removeProperty('z-index');
            p.style.removeProperty('visibility');
            p.style.removeProperty('transition');
            p.style.removeProperty('transform');
            p.style.removeProperty('transform-origin');
            p.style.removeProperty('pointer-events');
        }
        var ft = document.querySelector('.flowtime');
        if (ft) ft.style.removeProperty('transform');
        var sections = document.querySelectorAll('.ft-section');
        for (var i = 0; i < sections.length; i++) {
            sections[i].style.removeProperty('transform');
        }
    }

    function init() {
        if (!('ontouchstart' in document.documentElement)) return;
        if (!isMobilePortrait()) return;
        if (!window.Flowtime || !Flowtime.toggleOverview) return;
        if (init._done) return;
        init._done = true;

        if (Flowtime.addEventListener) {
            Flowtime.addEventListener('flowtimenavigation', function(e) {
                if (!e.isOverview && !_resetting) {
                    _resetting = true;
                    removeHeart();
                    requestAnimationFrame(function() {
                        var cur = document.querySelector('.ft-page.actual');
                        if (window.Flowtime && cur && cur.parentNode) {
                            Flowtime.gotoPage(cur.parentNode.index, cur.index);
                        }
                        _resetting = false;
                    });
                }
            });
        }

        document.addEventListener('touchstart', function(e) {
            if (!document.body.classList.contains('ft-overview')) return;
            var t = e.changedTouches[0];
            _touchStartTime = Date.now();
            var pg = pageAt(t.clientX, t.clientY);
            if (pg) previewPage(pg);
        }, true);

        document.addEventListener('touchmove', function(e) {
            if (!document.body.classList.contains('ft-overview')) return;
            e.preventDefault();
            e.stopPropagation();
            var t = e.changedTouches[0];
            var pg = pageAt(t.clientX, t.clientY);
            if (pg && pg !== _preview) previewPage(pg);
        }, { capture: true, passive: false });

        document.addEventListener('touchend', function(e) {
            var now = Date.now();
            var inOv = document.body.classList.contains('ft-overview');
            var diff = now - _lastTap;

            if (inOv) {
                e.preventDefault();
                e.stopPropagation();
                var t = e.changedTouches[0];
                var holdTime = now - _touchStartTime;
                if (diff < _tapTimeout && diff > 0) {
                    // 双击 → 退出 overview
                    _lastTap = 0;
                    if (_singleTimer) clearTimeout(_singleTimer);
                    clearPreview();
                    removeHeart();
                    Flowtime.toggleOverview(true);
                    return;
                }
                // 松手点在爱心外（灰色区域）→ 取消预览，不进入全屏，留在爱心排列
                if (!nearHeart(t.clientX, t.clientY)) {
                    _lastTap = now;
                    clearPreview();
                    return;
                }
                _lastTap = now;
                if (holdTime > 300) {
                    // 长按：松手 → 全屏跳转该页
                    if (_singleTimer) clearTimeout(_singleTimer);
                    gotoPreviewPage();
                    _lastTap = 0;
                } else {
                    // 快速单击：等 300ms，若没有第二次点击则跳转（可被双击取消）
                    if (_singleTimer) clearTimeout(_singleTimer);
                    _singleTimer = setTimeout(function() {
                        gotoPreviewPage();
                    }, 300);
                }
                return;
            }

            // 非 overview：双击进入心形排列
            if (diff < _tapTimeout && diff > 0) {
                e.preventDefault();
                e.stopPropagation();
                Flowtime.toggleOverview(true);
                _lastTap = 0;
                // 瞬间进入爱心排列：隐藏原生网格，立即重排（不显示原先排列）
                document.body.classList.add('_heart-entering');
                setTimeout(function() {
                    applyHeart();
                    document.body.classList.remove('_heart-entering');
                }, 30);
            } else {
                _lastTap = now;
            }
        }, true);
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
