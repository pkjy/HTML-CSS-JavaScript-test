//add页的获取时间
onload = function() {
    setInterval(function() {
        startTime.value = new Date().toLocaleString();
    }, 1000);
}

// record页获取时间
var interval_mark = self.setInterval("get_now_time()", 100);

function get_now_time() {
    var nowDate = new Date()
    var localTime = nowDate.toLocaleString();
    tempTime = document.getElementById("nowTime").innerHTML = localTime;
}
// record页开始暂停继续按钮
var x = 0

function sumAll() {
    if (x == 0) { //flag的作用，只有按一下有效
        startCount();
        countAllSeconds();
        x++; //flag的作用，只有按一下有效
    }
}

function startCount() {
    window.clearInterval(interval_mark);
}
var countNum = 0
var countToggle
var seconds_ = 0
var flag = 0

function countAllSeconds() {
    countNum += 1
    seconds_ = countNum
    minutes_ = countNum / 60
    hours_ = countNum / 3600
    document.getElementById("countAllSeconds").innerHTML = hours_ + "小时" + "<br/>" + minutes_ + "分钟" + "<br/>" + seconds_ + "秒"
    totalSeconds = hours_ + "小时"
    countToggle = setTimeout("countAllSeconds()", 1000)
    flag = 1
}

function continueCount() {　
    //利用一个flag，防止多按。
    if (flag == 0) {　
        countAllSeconds();
    }
}

// 开始Indexed DB
$(function() {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    if (!window.indexedDB) {
        alert("该浏览器不支持IndexedDB，请更换浏览器")
    }

    //打开(创建)数据库
    var req = window.indexedDB.open("Hours", 1);
    req.onsuccess = function(evt) {
        db = this.result;
        listAll();

    }
    req.onerror = function(evt) {
        alert("openDB:", evt.target.errorCode);
    }

    //onupgradeneeded事件 
    req.onupgradeneeded = function(event) {
        var db = event.target.result;

        //创建objectStore（对象库）
        var objectStore = db.createObjectStore("Data", {
            keyPath: "planName",
            autoIncrement: true
        })

        // 顺便创建六个索引
        objectStore.createIndex("planName", "planName", {
            unique: false
        });
        objectStore.createIndex("planTime", "planTime", {
            unique: false
        });
        objectStore.createIndex("recordStartTime", "recordStartTime", {
            unique: false
        });
        objectStore.createIndex("recordStopTime", "recordStopTime", {
            unique: false
        });
        objectStore.createIndex("startTime", "startTime", {
            unique: false
        });
        objectStore.createIndex("totalTime", "totalTime", {
            unique: false
        });
    }


});

//读取对应数据的details页的函数
function loadDetails(cursorKey) {
    var transaction = db.transaction("Data", "readwrite")
    var store = transaction.objectStore("Data")
    var idName = cursorKey.getAttribute("id")
    var request = store.get(idName)
    request.onsuccess = function(event) {
        if (request.result) {
            //切换页面
            $.mobile.changePage($("#details"))
                //读取对应内容
            $("#detailsPlanName").html(request.result.planName);
            $("#detailsStartTime").html(request.result.startTime);
            $("#detailsPlanTime").html(request.result.planTime + "小时");
            $("#detailsTotalTime").html(request.result.totalTime + "小时");
        }
    }
}

//默认首页list数据函数
function listAll() {
    var transaction = db.transaction("Data", "readwrite");
    var store = transaction.objectStore("Data");
    var request = store.openCursor();
    var str = "";
    request.onsuccess = function(event) {
        var cursor = event.target.result;

        if (cursor) {
            //计数冒泡显示完成率百分比
            var new_hours = parseFloat((cursor.value.totalTime / cursor.value.planTime) * 100);
            //遍历数据库给首页显示
            str += "<li class='ui-li-has-alt ui-li-has-count ui-li-has-thumb ui-first-child ui-last-child'><a href='#'  id='" + cursor.key + "' class='ui-btn padding_left'  onClick='loadDetails(this)'><h2>" + cursor.key + "</h2><p>已坚持：" + getTwoDecima(cursor.value.totalTime) + "小时</p><p>目标时间：" + cursor.value.planTime + "小时</p><span class='ui-li-count ui-body-inherit'>" + getTwoDecima(new_hours) + "%</span> </a><a href='#' data-icon='grid' class='info ui-btn ui-btn-icon-notext ui-icon-grid' id='fake" + cursor.key + "' onClick='loadRecord(this)'>打卡</a></li>";
            cursor.continue();
        } else {
            $("#liBox").html(str);

        }
    }
}

//取到小数点后两位
function getTwoDecima(s) {
    var s = s.toString();
    var new_str = s.substring(0, s.indexOf(".") + 3);
    return new_str;
}

//输入式精确删除函数
$("#del").on('click', showBtn)

function showBtn() {
    var transaction = db.transaction("Data", "readwrite")
    var store = transaction.objectStore("Data")
    var inputIndex = prompt("请输入要删除的计划名称！")
    if (inputIndex != null) {
        var testDel = store.delete(inputIndex)
        testDel.onsuccess = function() {
            alert("操作成功！");
            listAll();
        }
    }
}

//点击add页的确定按钮刷新并返回主页
$("#confirmBtn").click(function() {
    addClick("add");
    listAll();
    $.mobile.changePage($("#home"))
});

//add计划函数
function addClick(add_way) {
    var transaction = db.transaction("Data", "readwrite");
    store = transaction.objectStore("Data")
    if (add_way == "add") {
        request = store.add({
            planName: $("#planName").val(),
            startTime: $("#startTime").val(),
            planTime: $("#planTime").val(),
            recordStartTime: $("#startTime").val(),
            recordStopTime: 0,
            totalTime: 0
        })
    } else {
        request = store.put({
            planName: $("#planName").val(),
            startTime: $("#startTime").val(),
            planTime: $("#planTime").val(),
            recordStartTime: $("#startTime").val(),
            recordStopTime: 0,
            totalTime: 0
        })
    }
}


/*record页的停止按钮*/
function confirm_q(cursorKey) {
    var que = confirm("结束今天的学习了吗？")
    if (que == true) {
        alert("今天总共学习了" + totalSeconds + "\n开始时间：" + startTime.value + "\n结束时间：" + tempTime)
        var transaction = db.transaction("Data", "readwrite");
        var store = transaction.objectStore("Data")
        var idName = cursorKey.parentNode.parentNode.childNodes[1].lastChild.innerHTML
        var request = store.get(idName)
        request.onsuccess = function() {
            if (request.result) {
                new_total_time = parseFloat(request.result.totalTime) + parseFloat(totalSeconds)
                store.put({
                    planName: request.result.planName,
                    startTime: request.result.startTime,
                    planTime: request.result.planTime,
                    recordStartTime: request.result.recordStartTime,
                    recordStopTime: tempTime,
                    totalTime: new_total_time
                })
                window.location.reload()
            }
        }
    } else {
        href = "#"
    }
}

//编辑record按钮功能函数
function loadRecord(cursorKey) {
    var transaction = db.transaction("Data", "readwrite")
    var store = transaction.objectStore("Data")
    var idName = cursorKey.getAttribute("id").substr(4)
    var request = store.get(idName)
    request.onsuccess = function(event) {
        if (request.result) {
            //切换页面
            $.mobile.changePage($("#record"))
                //读取对应内容
            $("#recordPlanName").html(request.result.planName)　　
        }
    }
}

//删除所有数据
$("#del_all_plan").click(function() {
    if (confirm("即将删除所有数据！")) {
        window.indexedDB.deleteDatabase("Hours");
        alert("删除成功！");
        window.location.reload();
    }
});
