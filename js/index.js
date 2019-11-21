var vm = new Vue({
    el: '#app',
    data: {
        keyword: {
            name: '镇江市',
            adcode: '321100' //绘制区域的地区adcode值（根据父区域code可绘制子区域）
        },
        myEcharts: null,
        currentDate: null,
        dataList: [],
        statistics: {}, //各个统计量
        areaInfo: [], //地图各区域统计数据
        areaPlace: 0, //各地区实践所
        areaStation: 0, //各地区实践站
        areaPersonnel: 0, //各地区工作人员
        areaTotalNumber: 0, //各地区志愿者
        areaActivity: 0, //各地区实践活动
        platform: 0, //平台访问量
        stb: 0, //电视端
        mobile: 0, //手机端
        pieData: null, //饼图数据
        barData: null, //柱状图数据
        popularActivity: [], //最受欢迎的活动
        popularLeft: [], //左侧5个
        popularRight: [], //右侧5个
        processingActivity: [], //进行中的活动
        processingLeft: [], //左侧5个
        processingRight: [], //右侧5个
        starTeam: [], //明星志愿者团队
        starStation: [], //明星实践站
    },
    created: function () {
        this.getCloudInfo();
    },
    mounted: function () {
        this.showDate();
    },
    updated() {
        this.windowResize();
    },
    methods: {
        //获取云图所有数据
        getCloudInfo() {
            axios.get('/cloud/res/history/zj.json', {
                    responseType: 'arraybuffer',
                    headers: {
                        'Content-Type': 'multipart/form-data;charset=UTF-8'
                    },
                })
                .then(function (response) {
                    console.log(response);
                    if (response.status == 200) {
                        response = response.data.cloudInfo[0].json;
                        response = JSON.parse(response);
                        vm.dataList = response;
                        vm.statistics = vm.dataList.statistics;
                        vm.platform = vm.dataList.platform;
                        vm.stb = vm.dataList.stb;
                        vm.mobile = vm.dataList.mobile;
                        vm.$nextTick(function () {
                            vm.countUp(vm.$refs.centerCount);
                            vm.countUp(vm.$refs.placeCount);
                            vm.countUp(vm.$refs.stationCount);
                            vm.countUp(vm.$refs.personnelCount);
                            vm.countUp(vm.$refs.teamCount);
                            vm.echartsInit();
                        })
                        vm.showSwiper();
                        vm.showMap();
                    }
                })
                .catch(function (error) {
                    console.log(error);
                });
        },
        //显示时间
        showDate() {
            setInterval(function () {
                vm.currentDate = showTime();
            }, 1000)
        },
        //显示地图
        showMap() {
            this.areaInfo = this.dataList.areaInfo;
            var gdMap = new myMap();
            gdMap.initMap(this.keyword.adcode);
        },
        //echarts
        echartsInit() {
            this.myEcharts = new echartsObj();
            this.myEcharts.init();
        },
        //swiper
        showSwiper() {
            this.popularActivity = this.dataList.popularActivity; //最受欢迎的活动
            this.popularLeft = this.popularActivity.slice(0, 5);
            this.popularRight = this.popularActivity.slice(5, this.popularActivity.length);

            this.processingActivity = this.dataList.processingActivity; //进行中的活动
            this.processingLeft = this.processingActivity.slice(0, 5);
            this.processingRight = this.processingActivity.slice(5, this.processingActivity.length);

            this.starTeam = this.dataList.starTeam;
            this.starStation = this.dataList.starStation;

            this.$nextTick(function () {
                new Swiper('.swiper-container', {
                    direction: 'horizontal', // 垂直切换选项
                    loop: true, // 循环模式选项
                    autoplay: {
                        delay: 6000, //停留时长
                    },
                    speed: 2000 //切换速度
                })
            })
        },
        //监听屏幕尺寸变化
        windowResize() {
            window.onresize = function () {
                vm.myEcharts.pieObj.resize();
                vm.myEcharts.barObj.resize();
            }
        },
        //数字递增
        countUp(el) {
            var defaults = {
                startVal: 0,
                endVal: 0,
                speed: 1000, //速度
                refreshInterval: 100, //定时器刷新
                decimals: 0, //小数点后的位数，小数做四舍五入
                beforeSize: 0, //小数点前最小显示位数，不足的话用0代替
                lastSymbol: "", //后缀  %/w
            }
            defaults.startVal = el.dataset.startvalue ? Number(el.dataset.startvalue) : 0;
            defaults.endVal = Number(el.dataset.endvalue);

            var loops = Math.ceil(defaults.speed / defaults.refreshInterval);
            var increment = (defaults.endVal - defaults.startVal) / loops;
            var loopCount = 0;
            var value = defaults.startVal;
            var interval = setInterval(updataTimer, defaults.refreshInterval)

            function updataTimer() {
                value += increment;
                loopCount++;
                var str = value.toFixed(defaults.decimals);
                this.sizeNum = str.length;
                this.sizeNumBefore = this.sizeNum - defaults.decimals - 1;
                if (this.sizeNumBefore >= defaults.beforeSize) {
                    el.innerHTML = str + defaults.lastSymbol;
                } else {
                    this._str = Array(defaults.beforeSize - this.sizeNumBefore + 1).join('0') + str;
                    el.innerHTML = this._str + defaults.lastSymbol;
                }
                if (loopCount >= loops) {
                    clearInterval(interval);
                    el.innerHTML = defaults.endVal + defaults.lastSymbol;
                    value = el.innerHTML;
                }
            }
        }
    },
    filters: {
        dateStr(v1) {
            return v1.substr(5, 14);
        }
    },
    watch: {
        areaPlace: function (newVal, oldVal) {
            return newVal;
        },
        areaStation: function (newVal, oldVal) {
            return newVal;
        },
        areaPersonnel: function (newVal, oldVal) {
            return newVal;
        },
        areaTotalNumber: function (newVal, oldVal) {
            return newVal;
        },
        areaActivity: function (newVal, oldVal) {
            return newVal;
        }
    },
    computed: {

    }
});

// 地图
function myMap() {
    var map, districtExplorer;
    this.initMap = function (areacode) {
        //创建地图
        map = new AMap.Map('map_container', {
            resizeEnable: true,
            mapStyle: "amap://styles/darkblue",
            center: [118.754729, 32.076168], //中心点坐标
            zoom: 12 //地图显示的缩放级别
        });

        AMapUI.load(['ui/geo/DistrictExplorer', 'lib/$'], function (DistrictExplorer, $) {
            //创建一个实例
            districtExplorer = new DistrictExplorer({
                eventSupport: true, //打开事件支持
                map: map,
                subdistrict: 1, //返回下一级行政区
                showbiz: false //最后一级返回街道信息
            });

            //当前聚焦的区域
            var currentAreaNode = null;
            var adcodeArr = []; //子区域的code数组
            var areaColor = "#02d1d2"; //地图区域显示颜色
            var autoTimer = null;
            var autoIndex = 0;

            //切换区域
            function switchAreaNode(adcode, callback) {
                if (currentAreaNode && ('' + currentAreaNode.getAdcode() === '' + adcode)) {
                    return;
                }
                loadAreaNode(adcode, function (error, areaNode) {
                    if (error) {
                        if (callback) {
                            callback(error);
                        }
                        return;
                    }
                    currentAreaNode = window.currentAreaNode = areaNode;
                    //设置当前使用的定位用节点
                    districtExplorer.setAreaNodesForLocating([currentAreaNode]);
                    refreshAreaNode(areaNode);
                    if (callback) {
                        callback(null, areaNode);
                    }
                });
            }

            //加载区域
            function loadAreaNode(adcode, callback) {
                districtExplorer.loadAreaNode(adcode, function (error, areaNode) {
                    if (error) {
                        if (callback) {
                            callback(error);
                        }
                        console.error(error);
                        return;
                    }
                    if (callback) {
                        callback(null, areaNode);
                    }
                });
            }

            //切换区域后刷新显示内容
            function refreshAreaNode(areaNode) {
                districtExplorer.setHoverFeature(null);
                renderAreaPolygons(areaNode);
            }

            //绘制某个区域的边界
            function renderAreaPolygons(areaNode) {
                //更新地图视野
                map.setBounds(areaNode.getBounds(), null, null, true);
                //清除已有的绘制内容
                districtExplorer.clearFeaturePolygons();
                // 绘制父区域
                districtExplorer.renderParentFeature(areaNode, {
                    cursor: 'default',
                    bubble: true,
                    strokeColor: areaColor, //线颜色
                    strokeOpacity: 1, //线透明度
                    strokeWeight: 1, //线宽
                    fillColor: null, //填充色
                    fillOpacity: 0.4, //填充透明度
                });
                //绘制子区域
                polygonArr = districtExplorer.renderSubFeatures(areaNode, function (feature, i) {
                    adcodeArr.push({
                        adcode: feature.properties.adcode,
                        name: feature.properties.name,
                        center: feature.properties.center
                    });
                    return {
                        cursor: 'default',
                        bubble: true,
                        strokeColor: areaColor, //线颜色
                        strokeOpacity: 1, //线透明度
                        strokeWeight: 0.5, //线宽
                        fillColor: areaColor, //填充色
                        fillOpacity: 0.3, //填充透明度
                    };
                });

                //优先显示句容，数组翻转
                adcodeArr = adcodeArr.reverse();
                showTips(adcodeArr[0].name, adcodeArr[0].adcode, adcodeArr[0].center);

                autoTimer = setInterval(function () {
                    autoPlay();
                }, 3000);
            }

            //鼠标hover提示内容
            var $tipMarkerContent = $('<div class="tipMarker top"></div>');
            var tipMarker = new AMap.Marker({
                content: $tipMarkerContent.get(0),
                offset: new AMap.Pixel(0, 0),
                bubble: true
            });

            //根据Hover状态设置相关样式
            function toggleHoverFeature(feature, isHover, position) {
                tipMarker.setMap(isHover ? map : null);
                if (!feature) {
                    return;
                }
                var props = feature.properties;
                if (isHover) {
                    //更新提示内容
                    showTips(props.name, props.adcode, position || props.center);
                }

                //更新相关多边形的样式
                // var polys = districtExplorer.findFeaturePolygonsByAdcode(props.adcode);
                // for (var i = 0, len = polys.length; i < len; i++) {
                //     polys[i].setOptions({
                //         fillOpacity: isHover ? 0.8 : 0.4
                //     });
                // }
            }

            //监听feature的hover事件
            districtExplorer.on('featureMouseout featureMouseover', function (e, feature) {
                if (e.type == 'featureMouseover') {
                    clearInterval(autoTimer);
                    tipMarker.setMap(map);
                    for (var i = 0; i < adcodeArr.length; i++) {
                        //更新相关多边形的样式
                        var polys = districtExplorer.findFeaturePolygonsByAdcode(adcodeArr[i].adcode);
                        for (var j = 0, len = polys.length; j < len; j++) {
                            polys[j].setOptions({
                                fillOpacity: 0.4
                            });
                        }
                    }

                    toggleHoverFeature(feature, e.type === 'featureMouseover',
                        e.originalEvent ? e.originalEvent.lnglat : null);
                } else {
                    autoTimer = setInterval(function () {
                        autoPlay();
                    }, 2000);
                }
            });

            //监听鼠标在feature上滑动
            districtExplorer.on('featureMousemove', function (e, feature) {
                //更新提示位置
                tipMarker.setPosition(e.originalEvent.lnglat);
                // tipMarker.setPosition(feature.properties.center);
            });

            // feature被点击
            districtExplorer.on('featureClick', function (e, feature) {
                var props = feature.properties;
                //如果存在子节点
                // if (props.childrenNum > 0) {
                //     //切换聚焦区域，地图下钻
                //     switchAreaNode(props.adcode);
                // }
                if (props.adcode == '321183' || props.name.indexOf('句容市') > -1) {
                    window.location.href = 'https://jrwmsjzx.zj96296.com/jrCloud/index.html';
                }
            });

            //子区域轮播高亮
            function autoPlay() {
                autoIndex++;

                //先让所有子区域不高亮
                for (var i = 0; i < adcodeArr.length; i++) {
                    //更新相关多边形的样式
                    var polys = districtExplorer.findFeaturePolygonsByAdcode(adcodeArr[i].adcode);
                    for (var j = 0, len = polys.length; j < len; j++) {
                        polys[j].setOptions({
                            fillOpacity: 0.4
                        });
                    }
                }

                var autoObj = adcodeArr[autoIndex % adcodeArr.length];

                //高亮当前索引区域,更新提示内容
                showTips(autoObj.name, autoObj.adcode, autoObj.center);
            }

            //更新显示提示内容
            function showTips(name, adcode, center) {
                var polys = districtExplorer.findFeaturePolygonsByAdcode(adcode);
                for (var j = 0, len = polys.length; j < len; j++) {
                    polys[j].setOptions({
                        fillOpacity: 0.8
                    });
                }

                tipMarker.setMap(map);
                if (adcode == '321183' || name.indexOf('句容') > -1) {
                    name = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;句容市<br>点击进入云图'
                }
                $tipMarkerContent.html(name);
                //更新位置
                tipMarker.setPosition(center);

                //右侧数据替换展示
                vm.areaInfo.forEach(function (v, i) {
                    if (v.adcode == adcode || v.adcode == "" + adcode + "") {
                        vm.areaPlace = v.place;
                        vm.areaStation = v.station;
                        vm.areaPersonnel = v.personnel;
                        vm.areaTotalNumber = v.totalNumber;
                        vm.areaActivity = v.activity;
                    }
                })
            }

            //地图加载完成
            map.on("complete", function () {
                $('.loader').hide();
                $('.showData').show();

                //切换地图
                switchAreaNode(areacode);
            })
        })
    }
}

//echarts
function echartsObj() {
    this.pieObj = null; //饼图
    this.barObj = null; //柱状图
    this.init = function () {
        this.pie();
        this.bar();
    };

    //饼图
    this.pie = function () {
        vm.pieData = vm.dataList.itemAccess;
        this.pieObj = echarts.init(document.getElementById('pieChart'));
        var all = vm.pieData.all;
        var dataList = vm.pieData.each;
        var legendData = [];
        var seriesData = [];
        dataList.forEach(function (v, i) {
            legendData.push({
                name: v.name,
                icon: 'circle'
            });
            seriesData.push({
                name: v.name,
                value: v.value
            })
        })
        //中间文字配置
        seriesData[0].label = {
            normal: {
                show: true,
                position: 'center',
                formatter: '{a}',
                textStyle: {
                    color: '#fff',
                    fontSize: 12
                }
            }
        }
        option = {
            legend: {
                show: true,
                orient: 'vertical',
                left: '60%',
                top: 'middle',
                align: 'left',
                padding: 0,
                itemGap: 10,
                itemWidth: 10,
                data: legendData,
                textStyle: {
                    color: "#fff",
                    fontSize: 12,
                }
            },

            tooltip: { //悬浮显示
                trigger: "item",
                // formatter: "{a} <br/>{b}:{c} ({d}%)",
                formatter: "{b}:{d}%",
                position: function (p) {
                    return [p[0] - 20, p[1] - 10];
                },
                textStyle: {
                    fontSize: 12
                }
            },
            series: [{
                name: '活动\n' + all,
                type: 'pie',
                data: seriesData,
                center: ['28%', '52%'],
                radius: ['52%', '76%'],
                color: ['#00D9FB', '#EAF407', '#f58908', '#03DF98', '#FE546A'],
                hoverAnimation: true,
                hoverOffset: 3, //选中后饼偏移距离（大小）
                itemStyle: {
                    normal: {
                        label: {
                            show: false
                        },
                        labelLine: {
                            show: false
                        }
                    }
                }
            }]
        }
        this.pieObj.setOption(option);
        this.auto(this.pieObj, option, 1500);
    };

    //柱状图
    this.bar = function () {
        vm.barData = vm.dataList.ranking;
        var dataList = vm.barData;
        var xData = [];
        var yData = [];

        dataList.forEach(function (v) {
            xData.push(v.name);
            yData.push(v.value);
        })
        var showLen = 9; //显示的柱状图数量
        var _x = xData.slice(0, showLen);
        var _y = yData.slice(0, showLen);


        this.barObj = echarts.init(document.getElementById("barChart"));
        option = {
            tooltip: {
                trigger: 'axis',
                confine: true, //是否将悬浮框限制在图例中
                axisPointer: {
                    type: 'shadow'
                },
                position: function (p) {
                    return [p[0] - 56, p[1] - 40];
                },
                // formatter: '{b}<br>{a0}：{c0}<br>{a1}：{c1}'
            },
            grid: {
                left: 0,
                right: 0,
                bottom: "4%",
                top: "16%",
                padding: 0,
                containLabel: true
            },
            xAxis: [{
                type: "category",
                boundaryGap: true, //坐标轴两边留白
                data: _x,
                axisLabel: {
                    //坐标轴刻度标签的相关设置。
                    interval: 0, //设置为 1，表示『隔一个标签显示一个标签』
                    margin: 5,
                    textStyle: {
                        color: "#00F4FC",
                        fontStyle: "normal",
                        fontSize: 12
                    }
                },
                axisTick: {
                    //坐标轴刻度相关设置。
                    show: false
                },
                axisLine: {
                    //坐标轴轴线相关设置
                    lineStyle: {
                        color: "#00F4FC",
                        opacity: 0.2
                    }
                },
                splitLine: {
                    //坐标轴在 grid 区域中的分隔线。
                    show: false
                }
            }],
            yAxis: [{
                type: "value",
                splitNumber: 5,
                axisLabel: {
                    textStyle: {
                        color: "#00F4FC",
                        fontSize: 12
                    }
                },
                axisLine: {
                    lineStyle: {
                        color: "#00F4FC",
                        opacity: 0.2
                    }
                },
                axisTick: {
                    show: false
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: "#fff",
                        opacity: 0.06
                    }
                }
            }],
            series: [{
                name: "实践活动",
                type: "bar",
                data: _y,
                barWidth: 10,
                // barGap: 0.2, //柱间距离
                label: { //图形上的文本标签
                    show: true,
                    position: "top",
                    textStyle: {
                        fontStyle: "normal",
                        fontSize: 12
                    }
                },
                itemStyle: {
                    //图形样式
                    normal: {
                        color: '#03DF98'
                    }
                }
            }]
        };
        this.barObj.setOption(option);
        // this.auto(this.vodBar_obj, option, 2000);

        var count = xData.length > 9 ? showLen : xData.length;
        var timeTicket = null;
        var time = 1500;
        var _this = this;
        timeTicket = setInterval(function () {
            _x.shift();
            _x.push(xData[count]);
            _y.shift();
            _y.push(yData[count]);

            count++;
            if (count >= xData.length) {
                count = 0;
            }

            _this.barObj.setOption(option);
        }, time);

        this.barObj.on('mouseover', function (params) {
            timeTicket && clearInterval(timeTicket);
            _this.barObj.dispatchAction({
                type: 'downplay',
                seriesIndex: 0,
            });
            _this.barObj.dispatchAction({
                type: 'highlight',
                seriesIndex: 0,
                dataIndex: (count) % showLen
            });
            _this.barObj.dispatchAction({
                type: 'showTip',
                seriesIndex: 0,
                dataIndex: (count) % showLen
            });
        });

        this.barObj.on('mouseout', function (params) {
            timeTicket && clearInterval(timeTicket);
            timeTicket = setInterval(function () {
                _x.shift();
                _x.push(xData[count]);
                _y.shift();
                _y.push(yData[count]);

                count++;
                if (count >= xData.length) {
                    count = 0;
                }

                _this.barObj.setOption(option);
            }, time);
        });
    };

    //组件轮播
    this.auto = function (obj, option, time) {
        var count = 0;
        var timeTicket = null;
        var dataLength = option.series[0].data.length;
        timeTicket && clearInterval(timeTicket);
        timeTicket = setInterval(function () {
            obj.dispatchAction({
                type: 'downplay',
                seriesIndex: 0,
            });
            obj.dispatchAction({
                type: 'highlight',
                seriesIndex: 0,
                dataIndex: (count) % dataLength
            });
            obj.dispatchAction({
                type: 'showTip',
                seriesIndex: 0,
                dataIndex: (count) % dataLength
            });
            count++;
        }, time);

        obj.on('mouseover', function (params) {
            clearInterval(timeTicket);
            obj.dispatchAction({
                type: 'downplay',
                seriesIndex: 0,
            });
            obj.dispatchAction({
                type: 'highlight',
                seriesIndex: 0,
                dataIndex: (count) % dataLength
            });
            obj.dispatchAction({
                type: 'showTip',
                seriesIndex: 0,
                dataIndex: (count) % dataLength,

            });
        });

        obj.on('mouseout', function (params) {
            timeTicket && clearInterval(timeTicket);
            timeTicket = setInterval(function () {
                obj.dispatchAction({
                    type: 'downplay',
                    seriesIndex: 0,
                });
                obj.dispatchAction({
                    type: 'highlight',
                    seriesIndex: 0,
                    dataIndex: (count) % dataLength
                });
                obj.dispatchAction({
                    type: 'showTip',
                    seriesIndex: 0,
                    dataIndex: (count) % dataLength
                });
                count++;
            }, time);
        });
    }
}

//百分比
function GetPercent(num, total) {
    num = parseFloat(num);
    total = parseFloat(total);
    if (isNaN(num) || isNaN(total)) {
        return "0";
    }
    return total <= 0 ? "0" : (Math.round(num / total * 10000) / 100.00);
}

// 时间显示
function showTime() {
    var d = new Date();
    var year = d.getFullYear();
    var mounth = d.getMonth() + 1 < 10 ? "0" + (d.getMonth() + 1) : d.getMonth() + 1;
    var date = d.getDate() < 10 ? "0" + d.getDate() : d.getDate();
    var hour = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
    var minute = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
    var seconds = d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds();
    var time = year + "-" + mounth + "-" + date + "  " + hour + ":" + minute + ":" + seconds;
    return time;
    // $('.date').html(time);
}