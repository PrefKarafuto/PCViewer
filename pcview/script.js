document.addEventListener('DOMContentLoaded', () => {
    loadThreadList();
  });

  // URLの引数から[bbsname]を取得
const urlParams = new URLSearchParams(window.location.search);
const bbsname = urlParams.get('bbs');

if (!bbsname) {
  alert('bbsnameがURLに含まれていません');
}
  
  let openTabs = [];
  let displayedNewPosts = [];   // newpostsに表示されている投稿を保存する配列
  let currentActiveTab = null;
  
  const subjectFilePath = `../${bbsname}/subject.txt`;

  async function loadBBSMenu() {
    const response = await fetch('../test/bbsmenu.cgi');
    const arrayBuffer = await response.arrayBuffer();
    const textDecoder = new TextDecoder('shift_jis');
    const decodedText = textDecoder.decode(arrayBuffer);
    const bbsListElement = document.getElementById('bbslist');
    bbsListElement.innerHTML = decodedText;
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadBBSMenu(); // 掲示板一覧を読み込む
    loadThreadList(); // 既存のスレッドリストを読み込む
  });

  async function loadThreadList() {
    const response = await fetch(subjectFilePath);
    const arrayBuffer = await response.arrayBuffer();
    const textDecoder = new TextDecoder('shift_jis');
    const text = textDecoder.decode(arrayBuffer);
    const lines = text.split('\n');
  
    const threadListElement = document.getElementById('threadlist');
    threadListElement.innerHTML = '';
  
    lines.forEach((line, index) => {
      const [datFile, titleAndCount] = line.split('<>');
      if (datFile && titleAndCount) {
        const threadItem = document.createElement('div');
        threadItem.className = 'thread-item';
        const titleElement = document.createElement('span');
        const countElement = document.createElement('span');
  
        titleElement.innerHTML = `${index + 1}. ${titleAndCount.split(" ")[0]}`;
        countElement.textContent = titleAndCount.split(" ")[1];
        countElement.className = 'res-count';
  
        threadItem.appendChild(titleElement);
        threadItem.appendChild(countElement);
        threadItem.addEventListener('click', () => addNewTab(datFile, titleAndCount));
  
        threadListElement.appendChild(threadItem);
      }
    });
  }

  // タブに表示されているdatファイルの最後に読み込んだ投稿番号
const lastReadPostNumber = {};

function addNewPostsToNewpostsArea(newPosts, datFileName) {
    const newpostsArea = document.getElementById('newposts');
    
    // 最新30件の投稿だけを表示するための処理
    const existingPosts = newpostsArea.querySelectorAll('.post');
    while (existingPosts.length + newPosts.length > 30) {
      existingPosts[0].remove();
    }
  
    // 新しい投稿をnewpostsエリアに追加
    for (const post of newPosts) {
      const postElement = document.createElement('div');
      postElement.classList.add('post');
      
      // 投稿内容を適切に整形（例えば、HTMLタグをエスケープするなど）
      const formattedPost = post; // この部分は、postの内容に応じて適切に整形してください
      
      postElement.innerHTML = formattedPost;
      newpostsArea.appendChild(postElement);
    }
  }
  
  async function checkForUpdates() {
    for (const datFileName of openTabs) {
      const datFilePath = `../${bbsname}/dat/${datFileName}`;
      const response = await fetch(datFilePath);
      const arrayBuffer = await response.arrayBuffer();
      const textDecoder = new TextDecoder('shift_jis');
      const text = textDecoder.decode(arrayBuffer);
      const lines = text.split('\n');
  
      if (typeof lastReadPostNumber[datFileName] === 'undefined') {
        lastReadPostNumber[datFileName] = lines.length;
        continue;
      }
  
      if (lines.length > lastReadPostNumber[datFileName]) {
        const newPosts = lines.slice(lastReadPostNumber[datFileName]);
        lastReadPostNumber[datFileName] = lines.length;
  
        // newPostsをnewpostsエリアに追加
        addNewPostsToNewpostsArea(newPosts, datFileName);
      }
    }
  }
  

// 1分ごとにチェック
setInterval(checkForUpdates, 60 * 1000);
  
  function addNewTab(datFileName, titleAndCount) {
    if (openTabs.includes(datFileName)) {
      return;
    }
    openTabs.push(datFileName);
  
    const newTab = document.createElement('button');
    threadTitle = titleAndCount; // スレッドタイトルを取得
    newTab.innerHTML = threadTitle;
    newTab.id = `tab-${datFileName}`;
    newTab.onclick = function() {
      switchTab(datFileName);
    };

    // 初めて追加されたタブをアクティブにする
  if (currentActiveTab === null) {
    newTab.classList.add('active');
    currentActiveTab = newTab;
  }

    const closeButton = document.createElement('span');
    closeButton.textContent = '×';
    closeButton.className = 'close-tab-button';
    closeButton.onclick = function(event) {
        event.stopPropagation(); // 親要素（tab）のクリックイベントが発火しないようにする
        closeTab(datFileName);
    };
    newTab.appendChild(closeButton);
  
    document.getElementById('thread-tabs').appendChild(newTab);
  
    const newContent = document.createElement('div');
    newContent.id = `content-${datFileName}`;
    newContent.className = 'tab-content';
  
    document.getElementById('thread-contents').appendChild(newContent);
  
    loadThread(datFileName);
  }

  function closeTab(datFileName) {
    const tabIndex = openTabs.indexOf(datFileName);
    if (tabIndex !== -1) {
      openTabs.splice(tabIndex, 1);
      const tabElement = document.getElementById(`tab-${datFileName}`);
      tabElement.remove();
      const contentElement = document.getElementById(`content-${datFileName}`);
      contentElement.remove();
    }
  }

  function switchTab(datFileName) {
    openTabs.forEach(tab => {
      const tabElement = document.getElementById(`tab-${tab}`);
      // 他の全てのタブから `active` クラスを削除
      tabElement.classList.remove('active');
      document.getElementById(`content-${tab}`).style.display = 'none';
    });
  
    // クリックされたタブに `active` クラスを追加
    const newActiveTab = document.getElementById(`tab-${datFileName}`);
    newActiveTab.classList.add('active');
    currentActiveTab = newActiveTab;
  
    document.getElementById(`content-${datFileName}`).style.display = 'block';
  }

async function loadThread(datFileName) {
    const datFilePath = `../${bbsname}/dat/${datFileName}`;
    const response = await fetch(datFilePath);
    const arrayBuffer = await response.arrayBuffer();
    const textDecoder = new TextDecoder('shift_jis');
    const text = textDecoder.decode(arrayBuffer);
    const lines = text.split('\n');
    
    const threadElement = document.getElementById(`content-${datFileName}`);
    threadElement.innerHTML = '';
  
    lines.forEach((line, index) => {
        const [name, email, timestamp, content] = line.split('<>');
        if (name && timestamp && content) {
          const postElement = document.createElement('div');
          postElement.className = 'post';
      
          const headerElement = document.createElement('div');
          headerElement.className = 'post-header';
      
          const nameElement = document.createElement('span');
          nameElement.className = 'post-name';
          nameElement.textContent = name;
      
          const postNumberElement = document.createElement('span');
          postNumberElement.className = 'post-number';
          postNumberElement.textContent = `#${index + 1}`; // インデックスに1を加えて番号を生成
      
          const timestampElement = document.createElement('span');
          timestampElement.className = 'post-timestamp';
          timestampElement.textContent = timestamp;
      
          headerElement.appendChild(postNumberElement); // ここで番号をヘッダーに追加
          headerElement.appendChild(nameElement);
          headerElement.appendChild(timestampElement);
      
          const contentElement = document.createElement('div');
          contentElement.className = 'post-content';
          contentElement.innerHTML = content;  // HTMLタグを解釈
      
          postElement.appendChild(headerElement);
          postElement.appendChild(contentElement);
      
          threadElement.appendChild(postElement);
        }
      });
      
  
    switchTab(datFileName);
  }
  
const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');
const threadElement = document.getElementById('thread');

// スクロール位置をチェックしてボタンの表示・非表示を切り替える
threadElement.addEventListener('scroll', () => {
  if (threadElement.scrollTop + threadElement.clientHeight < threadElement.scrollHeight - 50) {
    scrollToBottomBtn.style.display = 'block';
  } else {
    scrollToBottomBtn.style.display = 'none';
  }
});

// ボタンがクリックされたら一番下までスクロール
scrollToBottomBtn.addEventListener('click', () => {
  threadElement.scrollTop = threadElement.scrollHeight;
});
// 再読み込みボタンを取得
const reloadButton = document.getElementById('reload-button');

// 再読み込みボタンの表示条件をチェックする関数
function checkReloadButtonDisplay() {
  const threadContents = document.getElementById('thread-contents');
  if (threadContents && threadContents.innerHTML.trim() !== '') {
    reloadButton.style.display = 'block';
  } else {
    reloadButton.style.display = 'none';
  }
}

// ボタンがクリックされたら再読み込みする関数
reloadButton.addEventListener('click', async () => {
  // 現在のアクティブなタブのdatファイルを再読み込み
  if (currentActiveTab) {
    const datFileName = currentActiveTab.id.replace('tab-', '');
    if (datFileName) {
      await loadThread(datFileName);
    }
  }
});

// 初回とタブが変更されるたびに、再読み込みボタンの表示をチェック
document.addEventListener('DOMContentLoaded', checkReloadButtonDisplay);
