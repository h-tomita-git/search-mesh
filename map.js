//////////////////////////////////
// 定数定義
//////////////////////////////////
const SIZE_FIRST_LAT = 40 / 60;
const SIZE_FIRST_LON = 1;
const SIZE_SECOND_LAT = 5 / 60;
const SIZE_SECOND_LON = 7.5 / 60;
const SIZE_THIRD_LAT = 30 / 60 / 60;
const SIZE_THIRD_LON = 45 / 60 / 60;

const MIN_LAT = 20;
const MIN_LON = 122;
const MAX_LAT = 45;
const MAX_LON = 154;

const MESH_MINMAX_LIST = [
  [22, 53],
  [30, 68],
  [0, 7],
  [0, 7],
  [0, 9],
  [0, 9]
]

const TABLE_MIN_ROW = 5;

//////////////////////////////////
// 変数定義
//////////////////////////////////

// メッシュサイズ配列を定義
const meshSizeArray = [
  [SIZE_FIRST_LAT, SIZE_FIRST_LON],
  [SIZE_SECOND_LAT, SIZE_SECOND_LON],
  [SIZE_THIRD_LAT, SIZE_THIRD_LON],
];

// レイヤーグループを準備
let layerGroup = {};

// 検索時のマーカーを準備
let searchMarker;

// メッシュのテキスト表示
let textVisiblity;

//////////////////////////////////
// ズームレベル・メッシュサイズ関数定義
//////////////////////////////////

// ズームレベルから表示するメッシュサイズを取得
function getMeshSizeLevel() {
  let zoomSize = map.getZoom();
  let meshSize;
  if (zoomSize < 10) {
    meshSize = 1;
  } else if (zoomSize < 13) {
    meshSize = 2;
  } else {
    meshSize = 3;
  }
  return meshSize;
}

// メッシュコードからメッシュサイズを取得
function getMeshSizeCode(meshCode) {
  if (meshCode.length === 4) {
    meshSize = 1;
  } else if (meshCode.length === 6) {
    meshSize = 2;
  } else if (meshCode.length === 8) {
    meshSize = 3;
  } else {
    meshSize = null;
  }
  return meshSize;
}

// メッシュサイズからズームレベルを算出
function getMeshLevel(meshSize) {
  let zoomSize = 9;
  if (meshSize === 1) {
    zoomSize = 9;
  } else if (meshSize === 2) {
    zoomSize = 12;
  } else if (meshSize === 3) {
    zoomSize = 14;
  }
  return zoomSize;
}

// ズームレベルからメッシュ内のテキスト表示／非表示を取得
function setTextVisiblity() {
  var meshSize = getMeshSizeLevel();
  var zoomSize = map.getZoom();
  if (meshSize == 1 && zoomSize < 7) {
    textVisiblity = false;
  } else if (meshSize == 3 && zoomSize < 14) {
    textVisiblity = false;
  } else {
    textVisiblity = true;
  }
}

//////////////////////////////////
// メッシュコード配列関数
//////////////////////////////////

// 緯度経度からメッシュコード配列取得
function getMeshArrayLatlon(size, tgtLat, tgtLon) {
  var meshArray = [];
  var tempLatCode;
  var tempLonCode;
  var modLat;
  var modLon;

  for (var i = 0; i < size; i++) {
    if (i == 0) {
      tempLatCode = Math.floor((tgtLat * 60) / 40);
      tempLonCode = Math.floor(tgtLon - 100);
      modLat = (tgtLat * 60) % 40;
      modLon = parseFloat("0." + String(tgtLon).split(".")[1]);
    } else if (i == 1) {
      tempLatCode = Math.floor(modLat / 5);
      tempLonCode = Math.floor((modLon * 60) / 7.5);
      modLat = modLat % 5;
      modLon = (modLon * 60) % 7.5;
    } else {
      tempLatCode = Math.floor((modLat * 60) / 30);
      tempLonCode = Math.floor((modLon * 60) / 45);
    }
    meshArray.push(tempLatCode, tempLonCode);
  }
  return meshArray;
}

// メッシュコードからメッシュコード配列を取得
function getMeshArrayCode(meshCode) {
  const meshLengthList = [2, 2, 1, 1, 1, 1];
  let tmpMeshCode = meshCode;
  let loopCounter = 0;
  let meshArray = [];
  // メッシュコードを配列に変換
  while (tmpMeshCode.length > 0) {
    tmpMeshSplit = tmpMeshCode.slice(0, meshLengthList[loopCounter]);
    meshArray.push(tmpMeshSplit);
    tmpMeshCode = tmpMeshCode.replace(tmpMeshSplit, "");
    loopCounter += 1;
  }
  return meshArray;
}

//////////////////////////////////
// 緯度経度取得関数
//////////////////////////////////

// メッシュの一辺の緯度経度サイズ配列取得
function getMeshLatlngUnit(size) {
  var tgtSizeIndex = size - 1;
  var unitSizeArray = meshSizeArray[tgtSizeIndex];
  return unitSizeArray;
}

// メッシュの左下緯度経度取得
function getMeshMinLatlng(meshArray) {
  var minLat = 0;
  var minLon = 100;

  // メッシュの最小緯度経度を算出
  for (var i = 0; i < meshArray.length; i++) {
    var index1 = Math.floor(i / 2);
    var index2 = i % 2;
    var tempCalc = meshArray[i] * meshSizeArray[index1][index2];
    if (i % 2 == 1) {
      minLon += tempCalc;
    } else {
      minLat += tempCalc;
    }
  }
  return [minLat, minLon];
}

//////////////////////////////////
// メッシュチェック関数
//////////////////////////////////

// 日本のメッシュチェック
function checkLatlonInside(minLat, minLon, maxLat, maxLon) {
  if (
    MIN_LAT <= minLat &&
    MIN_LON <= minLon &&
    maxLat <= MAX_LAT &&
    maxLon <= MAX_LON
  ) {
    return true;
  } else {
    return false;
  }
}

// メッシュコードの不正をチェック
function checkMeshCode(meshArrayList) {
  // 配列をチェック
  for (let i = 0; i < meshArrayList.length; i++) {
    // メッシュコードが数値でない場合は返却
    if (isNaN(meshArrayList[i])) {
      return false;
    }
    // メッシュコードが範囲内かどうかチェック
    tmpMeshInt = Number(meshArrayList[i]);
    if (
      !(tmpMeshInt >= MESH_MINMAX_LIST[i][0] &&
        tmpMeshInt <= MESH_MINMAX_LIST[i][1])
    ) {
      return false;
    }
  }
  return true;
}

//////////////////////////////////
// スタイル設定関数
//////////////////////////////////

// メッシュスタイル設定
function setMeshStyle(layer, selectedFlg) {
  let meshFillColor;
  switch (selectedFlg) {
    case true:
      meshFillColor = "#ff0000";
      break;
    case false:
      meshFillColor = "#ffffff";
      break;
  }
  layer.setStyle({
    color: "#ff0000",
    fillColor: meshFillColor,
    fillOpacity: 0.2,
    weight: 2,
  });
  return layer;
}

// メッシュにマウスオンした際のスタイルを設定
function setMouseOnStyle(layer) {
  layer.setStyle({
    weight: 3,
  });
  return layer;
}

// メッシュテキスト設定
function setMeshTips(layer, meshCode, mouseOnFlg) {
  let tipClassName;
  switch (mouseOnFlg) {
    case true:
      tipClassName = "leaflet-tooltip_mouseon";
      break;
    case false:
      tipClassName = "leaflet-tooltip_base";
      break;
  }
  layer.bindTooltip(meshCode, {
    permanent: true,
    direction: "center",
    className: tipClassName,
  });
  return layer;
}

//////////////////////////////////
// テーブル操作関数
//////////////////////////////////

// テーブル内のメッシュ数をカウント
function countTableMeshNum() {
  let meshTable = document.getElementById("list_table");
  let currRowNum = meshTable.rows.length;
  let countMeshNum = 0;
  for (let i = 0; i < currRowNum; i++) {
    // テーブル内のメッシュ数を加算
    if (meshTable.rows[i].cells[0].innerText.length > 0) {
      countMeshNum += 1;
    }
  }
  return countMeshNum;
}

// 選択したメッシュ数をテーブルの下部に表示
function displayMeshNum() {
  // 選択したメッシュ数をカウント
  let countMeshNum = countTableMeshNum();
  let meshNumDisplay = document.getElementById("selected_mesh_count");
  meshNumDisplay.innerText = "選択済みメッシュ数: " + String(countMeshNum);
}

// 選択したメッシュのテーブル行番号を取得
function getMeshRow(meshCode) {
  let meshTable = document.getElementById("list_table");
  let currRowNum = meshTable.rows.length;
  for (let i = 0; i < currRowNum; i++) {
    // テーブル内のメッシュからハイフンを除去して取得
    let cellText = meshTable.rows[i].cells[0].innerText.replace(/-/g, "");
    // 該当するメッシュの場合、行番号を返却
    if (cellText == meshCode) {
      return i;
    }
  }
  return null;
}

// テーブルの行数が不足する際に追加
function insertRowToTable(meshTable) {
  let insertRow = meshTable.insertRow(-1);
  insertRow.insertCell(-1);
  // クリックイベントを付与
  insertRow.addEventListener("click", function (e) {
    // メッシュにズーム
    let tgtMeshCode = e.currentTarget.innerText.replace(/-/g, "");
    zoomToMesh(tgtMeshCode);
  });
  return meshTable;
}

// 選択したメッシュをテーブルに追加
function insertTable(meshCode) {
  let meshTable = document.getElementById("list_table");
  let currRowNum = meshTable.rows.length;
  let inputCellIndex;
  // テーブル内容が空の行を探索
  for (let i = 0; i < currRowNum; i++) {
    let cellText = meshTable.rows[i].cells[0].innerText;
    if (cellText.length == 0) {
      // セルの中身が空の場合、対象行とする
      inputCellIndex = i;
      break;
    } else if (currRowNum == i + 1) {
      // 空のセルが無く、末尾に到達した場合は、末尾の行+1を対象行とする
      inputCellIndex = i + 1;
    }
  }
  // 行数が不足する場合は付与
  if (meshTable.rows.length < inputCellIndex + 1) {
    meshTable = insertRowToTable(meshTable);
  }
  // セルを追加
  let tgtCell = meshTable.rows[inputCellIndex].cells[0];
  // ハイフン有無の選択状態を取得
  let hyphen_selection = document.getElementById("select_hyphen").value;
  if (hyphen_selection.includes("-")) {
    // -ありの場合、メッシュコードにハイフンを付与
    meshCode = addHyphen(meshCode);
  }
  // メッシュコードを記入
  tgtCell.innerText = meshCode;
  // 選択メッシュ数を表示
  displayMeshNum();
  // マウスオンを設定
  tgtCell.addEventListener("mouseover", function (e) {
    e.target.style.background = "#c0c0c0";
  });
  tgtCell.addEventListener("mouseleave", function (e) {
    e.target.style.background = "";
  });
}

// 選択したメッシュをテーブルから削除
function removeTable(meshRow) {
  let meshTable = document.getElementById("list_table");
  // 対象行を削除
  meshTable.deleteRow(meshRow);
  // 削除した結果、最小行数未満の場合は、末尾に行追加
  let currRowNum = meshTable.rows.length;
  if (currRowNum < TABLE_MIN_ROW) {
    let lastRow = meshTable.insertRow(-1);
    lastRow.insertCell(-1);
    // クリックイベントを追加
    lastRow.addEventListener("click", function (e) {
      // メッシュにズーム
      let tgtMeshCode = e.currentTarget.innerText.replace(/-/g, "");
      zoomToMesh(tgtMeshCode);
    });
  }
  // 選択したメッシュ数を表示
  displayMeshNum();
}

// メッシュリストを並べ替え
function sortTable(sortOrder) {
  let meshTable = document.getElementById("list_table");
  let selectedRowNum = meshTable.rows.length;
  let selectedArray = [];
  for (let i = 0; i < selectedRowNum; i++) {
    // テーブル内のメッシュを取得
    let currRowMesh = meshTable.rows[i].cells[0].innerText;
    if (currRowMesh != "") {
      selectedArray.push(currRowMesh);
    }
  }
  let selectedArrayCount = selectedArray.length;
  if (selectedArrayCount === 0){
    return;
  }
  // 並べ替え
  if (sortOrder === "asc") {
    selectedArray.sort();
  } else if (sortOrder === "desc") {
    selectedArray.reverse();
  } else {
    return;
  }
  for (let n = 0; n < selectedRowNum; n++) {
    // 空白行は配列に入っていないため、配列の要素数まで
    if (n >= selectedArrayCount) {
      return;
    }
    // 並べ替えた順にメッシュコードを格納
    let currRow = meshTable.rows[n].cells[0];
    currRow.innerText = selectedArray[n];
  }
}

//////////////////////////////////
// マップレイヤー関数
//////////////////////////////////

// メッシュレイヤー表示
function setMeshLayer() {
  // ズームレベルから表示するメッシュサイズを取得
  var meshSize = getMeshSizeLevel();

  // ズームレベルからメッシュ内のテキスト表示／非表示を設定
  setTextVisiblity();

  // レイヤーグループを作成
  layerGroup["mesh"] = L.layerGroup();

  // 表示中の緯度経度範囲を取得
  var northLatlng = map.getBounds().getNorth();
  var southLatlng = map.getBounds().getSouth();
  var eastLatlng = map.getBounds().getEast();
  var westLatlng = map.getBounds().getWest();

  // 南西のメッシュコードを取得
  var minMeshArray = getMeshArrayLatlon(meshSize, southLatlng, westLatlng);

  // 南西のメッシュコードの最小緯度経度を取得
  var minMeshLatlng = getMeshMinLatlng(minMeshArray);
  var minMeshMinLat = minMeshLatlng[0];
  var minMeshMinLon = minMeshLatlng[1];

  // メッシュの一辺の緯度経度サイズ配列取得
  var unitSizeArray = getMeshLatlngUnit(meshSize);

  // 西端から東端までループ
  var lngCounter = 0;
  var currMeshMinLon;
  var currMeshMaxLon = 0;
  while (currMeshMaxLon < eastLatlng) {
    // 南端から北端までループ
    var latCounter = 0;
    var currMeshMinLat;
    var currMeshMaxLat = 0;
    while (currMeshMaxLat < northLatlng) {
      // 現在の4隅の緯度経度を算出
      currMeshMinLat = minMeshMinLat + unitSizeArray[0] * latCounter;
      currMeshMaxLat = minMeshMinLat + unitSizeArray[0] * (latCounter + 1);
      currMeshMinLon = minMeshMinLon + unitSizeArray[1] * lngCounter;
      currMeshMaxLon = minMeshMinLon + unitSizeArray[1] * (lngCounter + 1);
      // 現在のメッシュの中央の緯度経度を算出
      var currMeshCenterLat = currMeshMinLat + unitSizeArray[0] / 2;
      var currMeshCenterLon = currMeshMinLon + unitSizeArray[1] / 2;
      // 現在のメッシュコードを取得
      var currMeshCode = getMeshArrayLatlon(
        meshSize,
        currMeshCenterLat,
        currMeshCenterLon
      ).join("");
      // 日本のメッシュチェック
      if (checkLatlonInside(currMeshMinLat, currMeshMinLon, currMeshMaxLat, currMeshMaxLon)) {
        // メッシュポリゴン生成
        var meshPolygon = new L.polygon([
          [currMeshMinLat, currMeshMinLon],
          [currMeshMaxLat, currMeshMinLon],
          [currMeshMaxLat, currMeshMaxLon],
          [currMeshMinLat, currMeshMaxLon],
        ]);
        let selectedFlg = false;
        // 選択したメッシュの行番号を取得
        let tgtMeshRow = getMeshRow(currMeshCode);
        if (tgtMeshRow !== null) {
          // テーブルに存在する場合
          selectedFlg = true;
        }
        // スタイル設定
        meshPolygon = setMeshStyle(meshPolygon, selectedFlg);
        // テキスト表示設定
        if (textVisiblity) {
          meshPolygon = setMeshTips(meshPolygon, currMeshCode, false);
        }
        // ポップアップ設定
        meshPolygon.bindPopup(currMeshCode);

        // イベント設定
        meshPolygon.on("mouseover", function () {
          // スタイル設定
          meshPolygon = setMouseOnStyle(this);
          // meshPolygon = setMeshStyle(this, status);
          if (textVisiblity) {
            // テキストを取得
            var currMeshCode = this.getPopup().getContent();
            // テキスト表示を解除
            this.unbindTooltip();
            // テキスト表示設定
            meshPolygon = setMeshTips(this, currMeshCode, true);
          }
        });
        meshPolygon.on("mouseout", function () {
          // テキストを取得
          var currMeshCode = this.getPopup().getContent();
          let selectedFlg = false;
          // 選択したメッシュの行番号を取得
          let tgtMeshRow = getMeshRow(currMeshCode);
          if (tgtMeshRow !== null) {
            // テーブルに存在する場合
            selectedFlg = true;
          }
          // スタイル設定
          meshPolygon = setMeshStyle(this, selectedFlg);
          // テキスト表示設定
          if (textVisiblity) {
            // テキスト表示を解除
            this.unbindTooltip();
            // テキスト表示
            meshPolygon = setMeshTips(this, currMeshCode, false);
          }
        });
        meshPolygon.on("click", function () {
          // ポップアップが表示されるため、非表示にする
          this.closePopup();
          // テキストを取得
          var currMeshCode = this.getPopup().getContent();
          // 選択したメッシュの行番号を取得
          let selectedFlg = false;
          let tgtMeshRow = getMeshRow(currMeshCode);
          if (tgtMeshRow === null) {
            // テーブルに存在しない場合
            insertTable(currMeshCode);
            selectedFlg = true;
          } else {
            // テーブルに存在する場合
            removeTable(tgtMeshRow);
          }
          // スタイル設定
          setMeshStyle(this, selectedFlg);
        });
        // メッシュをメッシュグループに追加
        layerGroup["mesh"].addLayer(meshPolygon);
      }
      // カウンタを加算
      latCounter++;
    }
    // カウンタを加算
    lngCounter++;
  }
  // メッシュグループをレイヤーとして追加
  map.addLayer(layerGroup["mesh"]);
}

// マーカーがある場合、削除
function removeSearchMarker() {
  if (searchMarker) {
    map.removeLayer(searchMarker);
    delete searchMarker;
  }
}

//////////////////////////////////
// ボタン操作関数
//////////////////////////////////

// 検索
function zoomToPoint() {
  // 入力値を取得
  var zoomInputString = document.getElementById("latlng_input").value.trim();
  if (zoomInputString === "") {
    // 空欄で検索した場合、マーカーがあれば削除
    removeSearchMarker();
  }
  var zoomInputArray = zoomInputString.split(",");
  var zoomSize = 14;
  var searchLatlngArray = [
    parseFloat(zoomInputArray[0]),
    parseFloat(zoomInputArray[1]),
  ];
  // 検索地点を表示
  map.setView(searchLatlngArray, zoomSize);
  // マーカーがある場合、削除
  removeSearchMarker();
  // 検索地点にマーカーを立てる
  searchMarker = new L.marker(searchLatlngArray).addTo(map);
}

// 検索削除
function removeSearch() {
  // マーカーがある場合、削除
  removeSearchMarker();
  document.getElementById("latlng_input").value = "";
}

// メッシュへジャンプ
function zoomToMesh(meshCode) {
  // メッシュのサイズを算出
  let meshSize = getMeshSizeCode(meshCode);
  if (meshSize === null) {
    return;
  }
  // メッシュ配列を作成
  let meshArray = getMeshArrayCode(meshCode);
  // メッシュの左下緯度経度を取得
  let minLatlngArray = getMeshMinLatlng(meshArray);
  // メッシュサイズに応じて、中心地点を算出
  let centerLat = minLatlngArray[0] + meshSizeArray[meshSize - 1][0] / 2;
  let centerLon = minLatlngArray[1] + meshSizeArray[meshSize - 1][1] / 2;
  // 対象メッシュを表示
  let zoomSize = getMeshLevel(meshSize);
  map.setView([centerLat, centerLon], zoomSize);
}

// メッシュリストコピー
function copyMeshList() {
  let tableTexts = "";
  // テーブル取得
  let meshTable = document.getElementById("list_table");
  // 末尾まで行を順に処理
  for (let i = 0; (row = meshTable.rows[i]); i++) {
    let currText = row.cells[0].innerText;
    if (currText != "") {
      // データがある場合は、テキストに追加
      tableTexts += currText + "\r\n";
    }
  }
  // テキストをクリップボードへコピー
  navigator.clipboard.writeText(tableTexts);
}

// メッシュ貼り付け
function pasteMeshList() {
  // 貼り付けたメッシュのうち、最初のメッシュを保持（中心へジャンプのため）
  let pasteFirstMeshCode = null;
  // クリップボードの値を取得
  navigator.clipboard.readText()
  .then(
    function(clipText){
      // 貼り付けたテキストを¥r¥nで分割
      splitRows = clipText.split(String.fromCharCode(10));
      // 分割後のアイテムが一つの場合、¥nのみで再度分割
      if (splitRows.length === 1) {
        splitRows = clipText.split(String.fromCharCode(13));
      }
      // タブで分割
      for (let i = 0; i < splitRows.length; i++){
        splitRows[i] = splitRows[i].replace(String.fromCharCode(13), "").replace(String.fromCharCode(10), "").split(String.fromCharCode(9));
      }
      // メッシュ不正リストを作成
      let meshErrorArray = [];
      for (let i = 0; i < splitRows.length; i++){
        if (splitRows[i][0] == "") {
          continue;
        }
        // ハイフンを除去
        let currMeshCode = splitRows[i][0].replace(/-/g, "");
        // メッシュコードに該当するもののみ追加
        if (currMeshCode.length === 4 || currMeshCode.length === 6 || currMeshCode.length === 8) {
          // メッシュコード配列を取得
          let currMeshArray = getMeshArrayCode(currMeshCode);
          // メッシュコードが正しい場合のみテーブルに追加
          if (checkMeshCode(currMeshArray)) {
            // メッシュコードがすでにテーブルに存在するか確認
            if (getMeshRow(currMeshCode) === null) {
              // 存在しない場合のみ追加
              insertTable(currMeshCode);
              // 貼り付けた値の先頭の場合、値を保持
              if (pasteFirstMeshCode === null) {
                pasteFirstMeshCode = currMeshCode;
              }
            }
          } else {
            meshErrorArray.push(splitRows[i][0]);
          }
        } else {
          meshErrorArray.push(splitRows[i][0]);
        }
      }
      if (pasteFirstMeshCode != null) {
        // 貼り付けた先頭のメッシュを表示
        zoomToMesh(pasteFirstMeshCode);
      }
      if (meshErrorArray.length > 0) {
        alert("貼り付けメッシュコード不正: " + meshErrorArray);
      }
    }
  );
}

// テーブルクリア
function clearTable() {
  // テーブル取得
  let meshTable = document.getElementById("list_table");
  // テーブルの行削除
  while (meshTable.rows.length > 0) {
    meshTable.deleteRow(0);
  }
  // テーブルに行を追加
  for (let i = 0; i < TABLE_MIN_ROW; i++) {
    insertRowToTable(meshTable);
  }
  // 選択済みのメッシュ表示解除
  map.eachLayer(function (layer) {
    // マップ内のレイヤーを順に取得し、ポリゴンの場合に判定
    if (layer instanceof L.Polygon) {
      // 選択済みのスタイルが設定されている場合
      if (layer.options.fillColor == "#ff0000") {
        // スタイルを未選択状態に設定
        selectedFlg = false;
        // スタイル設定
        setMeshStyle(layer, selectedFlg);
      }
    }
  });
  // 選択したメッシュ数の表示を変更
  displayMeshNum();
}

// メッシュコードにハイフン付与
function addHyphen(meshCode) {
  let hyphenMeshCode = "";
  // 文字列内の文字を順に処理
  for (let i = 0; i < meshCode.length; i++) {
    if (i === 4 || i === 6) {
      // 5桁目、7桁目の追加前にハイフンを付与
      hyphenMeshCode += "-";
    }
    // 文字を追加
    hyphenMeshCode += meshCode.charAt(i);
  }
  return hyphenMeshCode;
}

// テーブルのハイフン有無を切り替え
function changeMeshHyphen(hyphen_selection) {
  // テーブル取得
  let meshTable = document.getElementById("list_table");
  // 末尾まで行を順に処理
  for (let i = 0; (row = meshTable.rows[i]); i++) {
    // 元のテキストを取得
    let original_text = row.cells[0].innerText;
    // ハイフンありにした場合
    if (hyphen_selection.includes("-")) {
      // 元のテキストにハイフンがない場合のみ付与処理
      if (!original_text.includes("-")) {
        // ハイフン付きのメッシュコードを取得し、置き換え
        row.cells[0].innerText = addHyphen(original_text);
      }
      // ハイフンなしにした場合
    } else {
      // ハイフンを除去
      row.cells[0].innerText = original_text.replace(/-/g, "");
    }
  }
}

//////////////////////////////////
// マップ表示
//////////////////////////////////

//緯度,経度,ズーム
var map = L.map("map_area").setView([35.658577, 139.745451], 9);
map.doubleClickZoom.disable();

// OpenStreetMap から地図画像を読み込む
L.tileLayer("https://{s}.tile.osm.org/{z}/{x}/{y}.png", {
  maxZoom: 18,
  attribution:
    'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ',
}).addTo(map);

// メッシュレイヤー表示
setMeshLayer();

// 選択したメッシュ数を表示
displayMeshNum();

//////////////////////////////////
// イベント定義
//////////////////////////////////

// 移動、ズームが終了時の処理
map.on("moveend", function (e) {
  // 前回のメッシュ表示を削除
  map.removeLayer(layerGroup["mesh"]);
  delete layerGroup["mesh"];

  // メッシュレイヤー表示
  setMeshLayer();
});

// HTML読み込み完了時の処理
document.addEventListener("DOMContentLoaded", function () {
  // テーブルに行を追加
  let meshTable = document.getElementById("list_table");
  for (let i = 0; i < TABLE_MIN_ROW; i++) {
    insertRowToTable(meshTable);
  }
});

// ハイフン有無の選択
let hyphen_selection = document.getElementById("select_hyphen");
hyphen_selection.addEventListener("change", function (e) {
  changeMeshHyphen(e.currentTarget.value);
});
