(function() {
	var canvas = $('#canvas');
	if (!canvas[0].getContext) {
		$("#error").show();
		return false;
	}

	// ============================================================
	//  响应式布局：根据屏幕尺寸动态调整 canvas 位置和缩放
	// ============================================================

	var mobileScale = 1;
	var isMobilePortrait = false;
	var isMobileLandscape = false;

	// 树在 canvas 中的大致位置（用于定位参考）
	// 通过分析 branch 数据估算：
	var tree = {
		centerX: 510,   // 树的水平中心点（canvas 坐标）
		centerY: 440,   // 树的垂直中心点（canvas 坐标）
		width: 380,     // 树的大致宽度
		height: 480,    // 树的大致高度（从 y=200 到 y=680）
		topY: 200,      // 树冠顶部 y
		bottomY: 680    // 树干底部 y
	};

	function resizeLayout() {
		var wrap = $('#wrap');
		var main = $('#main');
		var textEl = $('#text');
		var clockEl = $('#clock-box');
		var windowW = $(window).width();
		var windowH = $(window).height();
		var designW = 1100;
		var designH = 680;

		isMobilePortrait = (windowW < 768 && windowH > windowW);
		isMobileLandscape = (windowW < 900 && windowW >= windowH);

		// ---------- 手机竖屏：上(文字)中(树)下(计时)三段布局 ----------
		if (isMobilePortrait) {
			// 布局比例：
			//   顶部 0-32%：表白文字（可滚动）
			//   中部 28-90%：爱心树（约 62% 高度）
			//   底部 90-97%：计时器
			//   最底部 97-100%：来源栏
			var treeTopRatio = 0.28;   // 树顶部位置
			var treeBottomRatio = 0.90; // 树底部位置
			var treeHeightRatio = treeBottomRatio - treeTopRatio; // 0.62

			var scale = (windowH * treeHeightRatio) / designH;
			var scaledW = designW * scale;

			// 宽度限制：最多允许超出屏幕 50%（左右各裁 25%），让树更大更饱满
			var maxScale = (windowW * 1.50) / designW;
			if (scale > maxScale) {
				scale = maxScale;
				scaledW = designW * scale;
			}

			// 最小缩放：至少占高度的 50%
			var minScale = (windowH * 0.50) / designH;
			if (scale < minScale) {
				scale = minScale;
				scaledW = designW * scale;
			}

			mobileScale = scale;

			// 树定位：水平居中，顶部在 treeTopRatio 位置
			var wrapLeft = (windowW - scaledW) / 2;
			var wrapTop = windowH * treeTopRatio;

			// 应用样式
			main.css({
				'width': '100%',
				'height': windowH + 'px',
				'overflow': 'hidden',
				'position': 'relative',
				'display': 'block',
				'min-height': 'auto'
			});

			wrap.css({
				'position': 'absolute',
				'left': wrapLeft + 'px',
				'top': wrapTop + 'px',
				'width': designW + 'px',
				'height': designH + 'px',
				'margin': '0',
				'transform': 'scale(' + scale + ')',
				'transform-origin': '0 0'
			});

			// 竖屏：文字和时钟由 CSS 控制（absolute 定位在 main 内）
			textEl.removeAttr('style');
			clockEl.removeAttr('style');
			$('#code, #clock .digit, .clock-label, .clock-sub').removeAttr('style');

			$('html, body').css({
				'width': '100%',
				'height': '100%',
				'overflow': 'hidden',
				'margin': '0',
				'padding': '0'
			});

		// ---------- 手机横屏：整体等比缩放 ----------
		} else if (isMobileLandscape) {
			var footerHL = 28;
			var scaleL = Math.min(
				windowW / designW,
				(windowH - footerHL) / designH
			);
			mobileScale = scaleL;

			var scaledWL = designW * scaleL;
			var scaledHL = designH * scaleL;
			var wrapLeftL = (windowW - scaledWL) / 2;
			var wrapTopL = (windowH - footerHL - scaledHL) / 2;

			main.css({
				'width': '100%',
				'height': windowH + 'px',
				'display': 'block',
				'overflow': 'hidden',
				'position': 'relative',
				'min-height': 'auto'
			});

			wrap.css({
				'position': 'absolute',
				'left': wrapLeftL + 'px',
				'top': wrapTopL + 'px',
				'width': designW + 'px',
				'height': designH + 'px',
				'margin': '0',
				'transform': 'scale(' + scaleL + ')',
				'transform-origin': '0 0'
			});

			// 文字和时钟跟随 wrap 定位和缩放
			textEl.css({
				'position': 'absolute',
				'left': (wrapLeftL + 60 * scaleL) + 'px',
				'top': (wrapTopL + 90 * scaleL) + 'px',
				'width': (400 * scaleL) + 'px',
				'height': (425 * scaleL) + 'px'
			});
			$('#code').css('font-size', (16 * scaleL) + 'px');

			clockEl.css({
				'position': 'absolute',
				'left': (wrapLeftL + 60 * scaleL) + 'px',
				'top': (wrapTopL + 560 * scaleL) + 'px',
				'font-size': (24 * scaleL) + 'px'
			});
			$('#clock .digit').css('font-size', (56 * scaleL) + 'px');
			$('.clock-label').css('font-size', (20 * scaleL) + 'px');
			$('.clock-sub').css('font-size', (16 * scaleL) + 'px');

			$('html, body').css({
				'width': '100%',
				'height': '100%',
				'overflow': 'hidden'
			});

		// ---------- 桌面端：恢复原始布局 ----------
		} else {
			mobileScale = 1;
			isMobilePortrait = false;
			isMobileLandscape = false;

			main.css({
				'width': '100%',
				'height': 'auto',
				'min-height': '100vh',
				'display': 'block',
				'overflow': 'visible',
				'position': 'relative'
			});

			wrap.css({
				'position': 'relative',
				'left': 'auto',
				'top': 'auto',
				'width': designW + 'px',
				'height': designH + 'px',
				'transform': 'none',
				'margin': '10px auto 0'
			});

			// 清除所有 JS 设置的内联样式，让桌面 CSS 生效
			textEl.removeAttr('style');
			clockEl.removeAttr('style');
			$('#code, #clock .digit, .clock-label, .clock-sub').removeAttr('style');

			$('html, body').css({
				'width': 'auto',
				'height': 'auto',
				'overflow': 'auto'
			});
		}
	}

	// 初始化 & 窗口变化时重新计算
	resizeLayout();
	$(window).resize(function() {
		resizeLayout();
	});


	// ============================================================
	//  Canvas 初始化 & 树动画
	// ============================================================

	var width = canvas.width();
	var height = canvas.height();
	canvas.attr("width", width);
	canvas.attr("height", height);

	var opts = {
		seed: {
			x: width / 2 - 20,
			color: "rgb(190, 26, 37)",
			scale: 2
		},
		branch: [[535, 680, 570, 250, 500, 200, 30, 100, [[540, 500, 455, 417, 340, 400, 13, 100, [[450, 435, 434, 430, 394, 395, 2, 40]]], [550, 445, 600, 356, 680, 345, 12, 100, [[578, 400, 648, 409, 661, 426, 3, 80]]], [539, 281, 537, 248, 534, 217, 3, 40], [546, 397, 413, 247, 328, 244, 9, 80, [[427, 286, 383, 253, 371, 205, 2, 40], [498, 345, 435, 315, 395, 330, 4, 60]]], [546, 357, 608, 252, 678, 221, 6, 100, [[590, 293, 646, 277, 648, 271, 2, 80]]]]]],
		bloom: {
			num: 700,
			width: 1080,
			height: 650,
		},
		footer: {
			width: 1200,
			height: 5,
			speed: 10,
		}
	};

	var treeObj = new Tree(canvas[0], width, height, opts);
	var seed = treeObj.seed;
	var foot = treeObj.footer;
	var hold = 1;


	// ============================================================
	//  点击 / 触摸 坐标换算（考虑缩放）
	// ============================================================

	function getCanvasCoords(e) {
		var offset = canvas.offset();
		var x = e.pageX - offset.left;
		var y = e.pageY - offset.top;

		// 缩放后：视觉坐标 → canvas 原始坐标
		if (mobileScale !== 1) {
			x = x / mobileScale;
			y = y / mobileScale;
		}

		return { x: x, y: y };
	}

	function startLove() {
		hold = 0;
		canvas.unbind("click");
		canvas.unbind("mousemove");
		canvas.unbind("touchstart");
		canvas.removeClass('hand');

		// 尝试播放音乐（移动端需要用户交互触发）
		var bgm = $("#loveBgm")[0];
		var playPromise = bgm.play();
		if (playPromise !== undefined) {
			playPromise.catch(function() {});
		}
	}

	// 鼠标点击
	canvas.click(function(e) {
		var coords = getCanvasCoords(e);
		if (seed.hover(coords.x, coords.y)) {
			startLove();
		}
	}).mousemove(function(e) {
		var coords = getCanvasCoords(e);
		canvas.toggleClass('hand', seed.hover(coords.x, coords.y));
	});

	// 触摸点击（手机端）
	canvas.on('touchstart', function(e) {
		e.preventDefault();
		var touch = e.originalEvent.touches[0];
		var coords = getCanvasCoords(touch);
		if (seed.hover(coords.x, coords.y)) {
			startLove();
		}
	});


	// ============================================================
	//  动画序列
	// ============================================================

	var seedAnimate = eval(Jscex.compile("async",
	function() {
		seed.draw();
		while (hold) {
			$await(Jscex.Async.sleep(10));
		}
		while (seed.canScale()) {
			seed.scale(0.95);
			$await(Jscex.Async.sleep(10));
		}
		while (seed.canMove()) {
			seed.move(0, 2);
			foot.draw();
			$await(Jscex.Async.sleep(10));
		}
	}));

	var growAnimate = eval(Jscex.compile("async",
	function() {
		do {
			treeObj.grow();
			$await(Jscex.Async.sleep(10));
		} while ( treeObj . canGrow ());
	}));

	var flowAnimate = eval(Jscex.compile("async",
	function() {
		do {
			treeObj.flower(2);
			$await(Jscex.Async.sleep(10));
		} while ( treeObj . canFlower ());
	}));

	// 树右移动画（桌面端用，文字在左边，树移到右边露出文字）
	var moveAnimate = eval(Jscex.compile("async",
	function() {
		treeObj.snapshot("p1", 240, 0, 610, 680);
		while (treeObj.move("p1", 500, 0)) {
			foot.draw();
			$await(Jscex.Async.sleep(10));
		}
		foot.draw();
		treeObj.snapshot("p2", 500, 0, 610, 680);
		canvas.parent().css("background", "url(" + treeObj.toDataURL('image/png') + ")");
		canvas.css("background", "#ffe");
		$await(Jscex.Async.sleep(300));
		canvas.css("background", "none");
	}));

	var jumpAnimate = eval(Jscex.compile("async",
	function() {
		while (true) {
			treeObj.ctx.clearRect(0, 0, width, height);
			treeObj.jump();
			foot.draw();
			$await(Jscex.Async.sleep(25));
		}
	}));

	var textAnimate = eval(Jscex.compile("async",
	function() {
		var together = new Date();
		together.setFullYear(lover.info.year, (lover.info.month - 1), (lover.info.day));
		together.setHours(lover.info.hour);
		together.setMinutes(lover.info.minute);
		together.setSeconds(lover.info.second);
		together.setMilliseconds(0);
		$("#code").show().typewriter();
		$("#clock-box").fadeIn(500);
		while (true) {
			timeElapse(together);
			$await(Jscex.Async.sleep(1000));
		}
	}));

	// 主流程
	var runAsync = eval(Jscex.compile("async",
	function() {
		$await(seedAnimate());    // 爱心种子动画
		$await(growAnimate());    // 树生长
		$await(flowAnimate());    // 开花

		// 重新判断当前是否为手机竖屏（防止窗口旋转后状态不一致）
		var w = $(window).width();
		var h = $(window).height();
		var isPortrait = (w < 768 && h > w);

		if (isPortrait) {
			// 竖屏模式：文字在树的上方，不需要树右移
			// 把树保存为背景图（后面 jumpAnimate 会清空 canvas 画花瓣）
			foot.draw();
			var dataUrl = treeObj.toDataURL('image/png');
			// 将树保存为 wrap 的背景图（铺满整个 wrap）
			canvas.parent().css({
				'background-image': 'url(' + dataUrl + ')',
				'background-repeat': 'no-repeat',
				'background-position': 'center center',
				'background-size': '100% 100%'
			});
		} else {
			// 桌面/横屏：树右移，露出左边文字
			$await(moveAnimate());
		}

		textAnimate().start();    // 文字打字机 + 时钟
		$await(jumpAnimate());    // 花瓣飘落（循环）
	}));

	runAsync().start();
})();
