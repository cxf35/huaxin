(function() {
	var canvas = $('#canvas');
	if (!canvas[0].getContext) {
		$("#error").show();
		return false
	}

	// 移动端缩放相关变量
	var mobileScale = 1;
	var isMobilePortrait = false;
	var isMobileLandscape = false;

	function resizeForMobile() {
		var wrap = $('#wrap');
		var main = $('#main');
		var windowW = $(window).width();
		var windowH = $(window).height();
		var designW = 1100;
		var designH = 680;
		var bottomBarH = 40; // 底部来源文字预留高度

		isMobilePortrait = (windowW < 768 && windowH > windowW);
		isMobileLandscape = (windowW < 900 && windowW >= windowH);

		if (isMobilePortrait) {
			// ========== 手机竖屏 ==========
			// 可用高度 = 屏幕高度 - 底部来源条
			var availableH = windowH - bottomBarH;

			// 按高度缩放，让树尽可能大（占可用高度的 80%，上下留出文字和时钟空间）
			var scale = availableH / designH * 0.85;

			// 限制最小缩放
			scale = Math.max(0.5, scale);
			mobileScale = scale;

			// 计算缩放后的 wrap 尺寸
			var scaledW = designW * scale;
			var scaledH = designH * scale;

			// 水平居中（左右可能裁剪，但树的主体在中间）
			var wrapLeft = (windowW - scaledW) / 2;
			// 垂直居中
			var wrapTop = (availableH - scaledH) / 2;

			main.css({
				'width': '100%',
				'height': windowH + 'px',
				'overflow': 'hidden',
				'position': 'relative',
				'display': 'block'
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

			// 重置文字和时钟的内联样式，让 CSS 媒体查询的 fixed 定位生效
			$('#text, #clock-box, #code, #clock .digit').removeAttr('style');

			$('html, body').css({
				'width': '100%',
				'height': '100%',
				'overflow': 'hidden',
				'margin': '0',
				'padding': '0'
			});

		} else if (isMobileLandscape) {
			// ========== 手机横屏：整体等比缩放居中 ==========
			var scaleL = Math.min(windowW / designW, (windowH - 30) / designH);
			mobileScale = scaleL;

			var scaledWL = designW * scaleL;
			var scaledHL = designH * scaleL;
			var wrapLeftL = (windowW - scaledWL) / 2;
			var wrapTopL = (windowH - scaledHL) / 2;

			main.css({
				'width': '100%',
				'height': windowH + 'px',
				'display': 'block',
				'overflow': 'hidden',
				'position': 'relative'
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
			var textEl = $('#text');
			var clockEl = $('#clock-box');
			textEl.css({
				'position': 'absolute',
				'left': (wrapLeftL + 60 * scaleL) + 'px',
				'top': (wrapTopL + 80 * scaleL) + 'px',
				'width': (400 * scaleL) + 'px',
				'height': (425 * scaleL) + 'px',
				'font-size': (16 * scaleL) + 'px',
				'transform': 'none',
				'text-align': 'left'
			});
			clockEl.css({
				'position': 'absolute',
				'left': (wrapLeftL + 60 * scaleL) + 'px',
				'top': (wrapTopL + 550 * scaleL) + 'px',
				'font-size': (28 * scaleL) + 'px',
				'transform': 'none',
				'text-align': 'left'
			});
			$('#clock .digit').css('font-size', (64 * scaleL) + 'px');
			$('#code').css('font-size', (16 * scaleL) + 'px');

			$('html, body').css({
				'width': '100%',
				'height': '100%',
				'overflow': 'hidden'
			});

		} else {
			// ========== 桌面端 ==========
			mobileScale = 1;
			isMobilePortrait = false;
			isMobileLandscape = false;

			main.css({
				'width': '100%',
				'height': 'auto',
				'display': 'block',
				'overflow': 'visible'
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

			// 重置文字和时钟样式
			$('#text, #clock-box, #code, #clock .digit').removeAttr('style');

			$('html, body').css({
				'width': 'auto',
				'height': 'auto',
				'overflow': 'auto'
			});
		}
	}

	// 初始化和窗口变化时调用
	resizeForMobile();
	$(window).resize(function() {
		resizeForMobile();
	});

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
	var tree = new Tree(canvas[0], width, height, opts);
	var seed = tree.seed;
	var foot = tree.footer;
	var hold = 1;

	// 获取缩放后的正确点击坐标
	function getCanvasCoords(e) {
		var offset = canvas.offset();
		var x = e.pageX - offset.left;
		var y = e.pageY - offset.top;

		// 缩放后，需要将视觉坐标转换回 canvas 原始坐标
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
		// 尝试播放音乐
		var bgm = $("#loveBgm")[0];
		var playPromise = bgm.play();
		if (playPromise !== undefined) {
			playPromise.catch(function() {});
		}
	}

	canvas.click(function(e) {
		var coords = getCanvasCoords(e);
		if (seed.hover(coords.x, coords.y)) {
			startLove();
		}
	}).mousemove(function(e) {
		var coords = getCanvasCoords(e);
		canvas.toggleClass('hand', seed.hover(coords.x, coords.y));
	});

	// 触摸设备支持
	canvas.on('touchstart', function(e) {
		e.preventDefault();
		var touch = e.originalEvent.touches[0];
		var coords = getCanvasCoords(touch);
		if (seed.hover(coords.x, coords.y)) {
			startLove();
		}
	});

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
			tree.grow();
			$await(Jscex.Async.sleep(10));
		} while ( tree . canGrow ());
	}));
	var flowAnimate = eval(Jscex.compile("async",
	function() {
		do {
			tree.flower(2);
			$await(Jscex.Async.sleep(10));
		} while ( tree . canFlower ());
	}));
	var moveAnimate = eval(Jscex.compile("async",
	function() {
		tree.snapshot("p1", 240, 0, 610, 680);
		while (tree.move("p1", 500, 0)) {
			foot.draw();
			$await(Jscex.Async.sleep(10));
		}
		foot.draw();
		tree.snapshot("p2", 500, 0, 610, 680);
		canvas.parent().css("background", "url(" + tree.toDataURL('image/png') + ")");
		canvas.css("background", "#ffe");
		$await(Jscex.Async.sleep(300));
		canvas.css("background", "none");
	}));
	var jumpAnimate = eval(Jscex.compile("async",
	function() {
		var ctx = tree.ctx;
		while (true) {
			tree.ctx.clearRect(0, 0, width, height);
			tree.jump();
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
	var runAsync = eval(Jscex.compile("async",
	function() {
		$await(seedAnimate());
		$await(growAnimate());
		$await(flowAnimate());
		// 竖屏模式下跳过树右移动画（文字在上方，不需要树移开）
		if (!isMobilePortrait) {
			$await(moveAnimate());
		} else {
			// 竖屏：简单做一个背景切换效果，然后直接进入文字
			foot.draw();
			canvas.parent().css("background", "url(" + tree.toDataURL('image/png') + ")");
			canvas.css("background", "#ffe");
			$await(Jscex.Async.sleep(300));
			canvas.css("background", "none");
			canvas.parent().css("background", "");
		}
		textAnimate().start();
		$await(jumpAnimate());
	}));
	runAsync().start();
})();
