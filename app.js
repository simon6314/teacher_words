// Teacher Comment AI Generator - Frontend Application Logic (DeepSeek & Privacy Masking Edition)

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. Settings & LocalStorage Core State
  // ==========================================
  
  const DEFAULT_PROMPTS = {
    warm: "你是一位溫暖、體貼且非常正面的班導師。請根據以下學生的座號 {seat} 與姓名 {name}，以及他們的日常表現關鍵詞，產生一段 100 到 150 字的學期末評語。語氣應溫柔、充滿鼓勵，多著眼於他們的優點，並用親切、溫暖的用詞來肯定他們的努力。請務必完整結束句子，結尾須包含一句對他未來的祝福或勉勵。關鍵詞如下：{keywords}",
    formal: "你是一位專業、客觀且用字嚴謹的學校導師。請根據以下學生的座號 {seat} 與姓名 {name}，以及他們的日常表現關鍵詞，產生一段 100 到 150 字的學期末評語。語氣應客觀適中、條理分明、用字精準且措辭得體，既要肯定其表現，也要以客觀態度陳述。請務必完整結束段落並以句號收尾，結尾須包含一句對他未來的期許。關鍵詞如下：{keywords}",
    expectant: "你是一位對學生充滿期待且循循善誘的導師。請根據以下學生的座號 {seat} 與姓名 {name}，以及他們的日常表現關鍵詞，產生一段 100 到 150 字的學期末評語。語氣應誠懇且具建設性，在肯定學生優點的同時，溫和且明確地指出他們未來可以改進和努力的方向（例如：改善上課分心、加強同儕合作等）。請務必完整結束句子，結尾須包含一句對他未來的期勉。關鍵詞如下：{keywords}",
    concise: "你是一位說話精煉、重點清晰的導師。請根據以下學生的座號 {seat} 與姓名 {name}，以及他們的日常表現關鍵詞，產生一段 80 到 120 字的簡明期末評語。不要有冗長的修飾詞，直接點出學生的核心特質、主要表現與未來勉勵。請務必完整結束段落，以句號結尾。關鍵詞如下：{keywords}"
  };

  const QUICK_TAGS = {
    general: [
      "活潑開朗", "溫和有禮", "熱心公務", "認真負責", "具領導潛力", 
      "樂觀自信", "體貼懂事", "沉穩內斂", "有正義感", "做事細心", 
      "幽默大方", "性情溫和", "行事獨立", "積極主動"
    ],
    academic: [
      "學習專注", "理解力強", "發言積極", "字跡端正工整", "作業認真完成", 
      "數理表現優異", "語文能力佳", "具求知慾", "學習態度積極", "體育表現優異",
      "粗心大意", "學習被動", "作業缺交", "邏輯思考佳", "藝能科表現出色"
    ],
    conduct: [
      "遵守秩序", "愛惜公物", "做事有條不紊", "打掃認真負責", "守時有禮", 
      "做事偶有拖延", "上課容易分心", "常與同學講話", "自律能力待加強", "情緒管理良好"
    ],
    social: [
      "人緣極佳", "樂於助人", "合作精神佳", "善於溝通", "待人誠懇", 
      "相處融洽", "喜愛團隊合作", "主動關懷同儕", "能包容他人"
    ]
  };

  // Default GAS URL supplied by the user (API Keys are stored on the GAS backend now)
  const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbxnODExTcKePfCKHqEEI5oZ3d3EGaohc9Yvi4dol4LEvEufTMRgIFUKpjDZhMnIjFje/exec';

  // State Variables (Use localStorage or load defaults directly)
  let appState = {
    gasUrl: localStorage.getItem('tw_gas_url') || DEFAULT_GAS_URL,
    customPrompt: localStorage.getItem('tw_custom_prompt') || '你是一位溫暖的導師，請根據關鍵詞：{keywords}，為座號 {seat} 姓名 {name} 撰寫 120 字的鼓勵評語。',
    
    semesters: [],
    students: [],
    completedSemesters: [],
    sheetNames: [],
    selectedSheet: '',
    
    selectedSemester: '',
    selectedStudentSeat: '',
    activeTagCategory: 'general'
  };

  // Pre-seed localStorage if empty to make Settings modal match
  if (!localStorage.getItem('tw_gas_url')) localStorage.setItem('tw_gas_url', appState.gasUrl);

  // ==========================================
  // 2. DOM Elements Selection
  // ==========================================
  
  // Header Actions & Status
  const syncDot = document.getElementById('syncDot');
  const syncText = document.getElementById('syncText');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  
  // Sidebar elements
  const sheetSelect = document.getElementById('sheetSelect');
  const semesterSelect = document.getElementById('semesterSelect');
  const addSemesterBtn = document.getElementById('addSemesterBtn');
  const completeSemesterBtn = document.getElementById('completeSemesterBtn');
  const studentSearchInput = document.getElementById('studentSearchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const progressText = document.getElementById('progressText');
  const progressBar = document.getElementById('progressBar');
  const addStudentBtn = document.getElementById('addStudentBtn');
  const studentList = document.getElementById('studentList');
  
  // Workspace views
  const welcomeView = document.getElementById('welcomeView');
  const editorPanel = document.getElementById('editorPanel');
  
  // Student Info Header
  const activeSeatBadge = document.getElementById('activeSeatBadge');
  const activeNameDisplay = document.getElementById('activeNameDisplay');
  const activeSemesterDisplay = document.getElementById('activeSemesterDisplay');
  const activeStatusBadge = document.getElementById('activeStatusBadge');
  
  // Keywords & Quick Tags
  const keywordsInput = document.getElementById('keywordsInput');
  const clearKeywordsBtn = document.getElementById('clearKeywordsBtn');
  const tagsContainer = document.getElementById('tagsContainer');
  const tagsTabButtons = document.querySelectorAll('.tags-tab-btn');
  
  // AI Controls
  const geminiModelSelect = document.getElementById('geminiModelSelect');
  const promptStyleSelect = document.getElementById('promptStyleSelect');
  const generateCommentBtn = document.getElementById('generateCommentBtn');
  const generateLoader = document.getElementById('generateLoader');
  
  // AI Result Textareas
  const geminiOutput = document.getElementById('geminiOutput');
  const copyGeminiBtn = document.getElementById('copyGeminiBtn');
  const adoptGeminiBtn = document.getElementById('adoptGeminiBtn');
  const copyPromptBtn = document.getElementById('copyPromptBtn');
  
  // Final Comment Output Area
  const commentOutput = document.getElementById('commentOutput');
  const wordCounter = document.getElementById('wordCounter');
  const copyCommentBtn = document.getElementById('copyCommentBtn');
  const saveCommentBtn = document.getElementById('saveCommentBtn');
  const saveLoader = document.getElementById('saveLoader');
  
  // Modals
  const settingsModal = document.getElementById('settingsModal');
  const settingsForm = document.getElementById('settingsForm');
  const gasUrlInput = document.getElementById('gasUrlInput');
  const customPromptInput = document.getElementById('customPromptInput');
  const testGASConnectionBtn = document.getElementById('testGASConnectionBtn');
  
  const addStudentModal = document.getElementById('addStudentModal');
  const addStudentForm = document.getElementById('addStudentForm');
  const newStudentSeat = document.getElementById('newStudentSeat');
  const newStudentName = document.getElementById('newStudentName');
  const addStudentLoader = document.getElementById('addStudentLoader');
  
  const addSemesterModal = document.getElementById('addSemesterModal');
  const addSemesterForm = document.getElementById('addSemesterForm');
  const newSemesterName = document.getElementById('newSemesterName');
  const addSemesterLoader = document.getElementById('addSemesterLoader');

  // ==========================================
  // 3. API & Server Integration (GAS)
  // ==========================================
  
  function updateSyncIndicator(state, message) {
    syncDot.className = 'sync-dot ' + state;
    syncText.textContent = message;
  }

  async function callGAS(params) {
    if (!appState.gasUrl) {
      updateSyncIndicator('state-disconnected', '尚未設定試算表 URL');
      throw new Error('No GAS URL configured');
    }
    
    updateSyncIndicator('state-connecting', '與試算表同步中...');
    
    // Auto-inject selected sheet name if we have one and it's not overridden
    if (appState.selectedSheet && !params.sheetName) {
      params.sheetName = appState.selectedSheet;
    }
    
    // Add timestamp cache buster
    params.cb = Date.now();
    const queryString = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
      
    try {
      const response = await fetch(`${appState.gasUrl}?${queryString}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data && data.error) {
        throw new Error(data.error);
      }
      updateSyncIndicator('state-connected', '已連線並同步試算表');
      return data;
    } catch (error) {
      updateSyncIndicator('state-disconnected', '連線失敗，請檢查設定');
      console.error('GAS connection error:', error);
      throw error;
    }
  }

  // Load and refresh core data from spreadsheet
  async function syncRoster() {
    if (!appState.gasUrl) return;
    
    try {
      // Pass the selectedSheet if set
      const params = { action: 'getData' };
      if (appState.selectedSheet) {
        params.sheetName = appState.selectedSheet;
      }
      
      const result = await callGAS(params);
      appState.semesters = result.semesters || [];
      appState.students = result.students || [];
      appState.completedSemesters = result.completedSemesters || [];
      appState.sheetNames = result.sheetNames || [];
      
      // Update selectedSheet to match what the backend actually loaded
      appState.selectedSheet = result.currentSheetName || '';
      
      // Render Sheet Select Dropdown
      renderSheetDropdown();
      
      // Update Semester Dropdown
      const prevSelectedSem = appState.selectedSemester;
      
      if (appState.semesters.length > 0) {
        // 優先選取第一個「尚未完成」的學期作為預設選單；若皆已完成，則使用 backend 回傳的 activeSemester 或第一個學期
        let defaultSem = appState.semesters.find(s => !appState.completedSemesters.includes(s));
        if (!defaultSem) {
          defaultSem = result.activeSemester;
        }
        if (!defaultSem || !appState.semesters.includes(defaultSem)) {
          defaultSem = appState.semesters[0];
        }
        
        if (prevSelectedSem && appState.semesters.includes(prevSelectedSem)) {
          appState.selectedSemester = prevSelectedSem;
        } else {
          appState.selectedSemester = defaultSem;
        }
        
        renderSemesterDropdown();
        updateCompleteSemesterButtonState();
      } else {
        renderSemesterDropdown();
        updateCompleteSemesterButtonState();
      }
      
      renderStudentList();
      updateProgressMetrics();
      
      // If a student is currently active, reload their details
      if (appState.selectedStudentSeat) {
        loadStudentDetails(appState.selectedStudentSeat);
      }
    } catch (error) {
      alert(`載入試算表失敗，原因：\n${error.message}\n\n請確認您的 GAS URL 設定是否正確，且已部署發佈。`);
    }
  }

  // Helper to render the semester dropdown option list with completed tags
  function renderSemesterDropdown() {
    if (appState.semesters.length === 0) {
      semesterSelect.innerHTML = '<option value="">(無學期，請新增)</option>';
      appState.selectedSemester = '';
      return;
    }
    
    semesterSelect.innerHTML = appState.semesters.map(s => {
      const isCompleted = appState.completedSemesters.includes(s);
      const suffix = isCompleted ? ' (已完成)' : '';
      return `<option value="${s}">${s} 學期${suffix}</option>`;
    }).join('');
    
    if (appState.selectedSemester && appState.semesters.includes(appState.selectedSemester)) {
      semesterSelect.value = appState.selectedSemester;
    }
  }
 
  // Helper to render the sheet dropdown option list
  function renderSheetDropdown() {
    if (appState.sheetNames.length === 0) {
      sheetSelect.innerHTML = '<option value="">(無分頁)</option>';
      return;
    }
    
    sheetSelect.innerHTML = appState.sheetNames.map(name => {
      const selected = name === appState.selectedSheet ? 'selected' : '';
      return `<option value="${name}" ${selected}>${name}</option>`;
    }).join('');
  }

  // Update completeSemesterBtn appearance depending on whether selected semester is completed
  function updateCompleteSemesterButtonState() {
    const isCompleted = appState.completedSemesters.includes(appState.selectedSemester);
    if (isCompleted) {
      completeSemesterBtn.innerHTML = '🔓 重開此學期 (解除已完成狀態)';
      completeSemesterBtn.className = 'btn btn-secondary btn-full btn-xs';
    } else {
      completeSemesterBtn.innerHTML = '🏁 完成此學期 (切換至下一學期)';
      completeSemesterBtn.className = 'btn btn-secondary btn-full btn-xs';
    }
  }

  // ==========================================
  // 4. UI Rendering Functions
  // ==========================================

  function renderStudentList() {
    const query = studentSearchInput.value.trim().toLowerCase();
    
    const filteredStudents = appState.students.filter(s => {
      if (!query) return true;
      return String(s.seat).toLowerCase().includes(query) || s.name.toLowerCase().includes(query);
    });

    if (filteredStudents.length === 0) {
      studentList.innerHTML = '<li class="list-empty">無匹配的學生</li>';
      return;
    }

    studentList.innerHTML = filteredStudents.map(student => {
      const activeSem = appState.selectedSemester;
      const hasComment = activeSem && 
                         student.data[activeSem] && 
                         student.data[activeSem].comment;
      
      const badgeClass = hasComment ? 'badge-completed' : 'badge-missing';
      const badgeText = hasComment ? '已完成' : '未撰寫';
      const isActive = String(student.seat) === String(appState.selectedStudentSeat) ? 'active' : '';

      return `
        <li class="student-item ${isActive}" data-seat="${student.seat}">
          <div class="student-info">
            <span class="student-seat">${String(student.seat).padStart(2, '0')}</span>
            <span class="student-name">${student.name}</span>
          </div>
          <span class="status-badge ${badgeClass}">${badgeText}</span>
        </li>
      `;
    }).join('');

    // Add click events to roster items
    document.querySelectorAll('.student-item').forEach(item => {
      item.addEventListener('click', () => {
        const seat = item.dataset.seat;
        loadStudentDetails(seat);
      });
    });
  }

  function updateProgressMetrics() {
    const activeSem = appState.selectedSemester;
    if (!activeSem || appState.students.length === 0) {
      progressText.textContent = '0 / 0 人 (0%)';
      progressBar.style.width = '0%';
      return;
    }

    const total = appState.students.length;
    const completed = appState.students.filter(s => 
      s.data[activeSem] && s.data[activeSem].comment
    ).length;
    
    const percentage = Math.round((completed / total) * 100) || 0;
    
    progressText.textContent = `${completed} / ${total} 人 (${percentage}%)`;
    progressBar.style.width = `${percentage}%`;
  }

  function loadStudentDetails(seat) {
    appState.selectedStudentSeat = seat;
    const student = appState.students.find(s => String(s.seat) === String(seat));
    if (!student) return;

    // Highlight in list
    document.querySelectorAll('.student-item').forEach(item => {
      if (String(item.dataset.seat) === String(seat)) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    const activeSem = appState.selectedSemester;
    const semData = (activeSem && student.data[activeSem]) || { keywords: '', comment: '' };

    // Set fields
    activeSeatBadge.textContent = String(student.seat).padStart(2, '0');
    activeNameDisplay.textContent = student.name;
    activeSemesterDisplay.textContent = `${activeSem} 學期`;
    
    keywordsInput.value = semData.keywords || '';
    commentOutput.value = semData.comment || '';
    
    // Clear temporary AI output until requested
    geminiOutput.value = '';
    
    // Update word count
    updateWordCounter();

    // Update Status Badge
    if (semData.comment) {
      activeStatusBadge.className = 'status-badge badge-completed';
      activeStatusBadge.textContent = '已完成';
    } else {
      activeStatusBadge.className = 'status-badge badge-missing';
      activeStatusBadge.textContent = '未撰寫';
    }

    // Toggle Workspace view
    welcomeView.style.display = 'none';
    editorPanel.style.display = 'flex';

    // Scroll editor panel into view on mobile
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        editorPanel.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }

  function updateWordCounter() {
    const length = commentOutput.value.length;
    wordCounter.textContent = `${length} 字`;
  }

  // Populate Quick Tags Container
  function renderQuickTags() {
    const category = appState.activeTagCategory;
    const tags = QUICK_TAGS[category] || [];
    
    tagsContainer.innerHTML = tags.map(tag => 
      `<button class="tag-btn">${tag}</button>`
    ).join('');
    
    // Add Click listener to append keyword
    document.querySelectorAll('.tag-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tagText = btn.textContent;
        const currentKeywords = keywordsInput.value.trim();
        
        if (currentKeywords) {
          // If keywords already ends with comma or space, append cleanly, else insert comma
          if (currentKeywords.endsWith(',') || currentKeywords.endsWith('，') || currentKeywords.endsWith(' ')) {
            keywordsInput.value = currentKeywords + tagText;
          } else {
            keywordsInput.value = currentKeywords + '、' + tagText;
          }
        } else {
          keywordsInput.value = tagText;
        }
        
        // Triggers visual feedback
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => btn.style.transform = 'scale(1)', 100);
      });
    });
  }

  // ==========================================
  // 5. Dual LLM Generation via GAS API Proxy
  // ==========================================
  
  async function generateAIComments() {
    const student = appState.students.find(s => String(s.seat) === String(appState.selectedStudentSeat));
    if (!student) return;

    const keywords = keywordsInput.value.trim();
    if (!keywords) {
      alert('請先輸入或選擇日常表現關鍵詞！');
      return;
    }

    const geminiModel = geminiModelSelect.value;
    const style = promptStyleSelect.value;
    
    // Set UI Loader & reset textarea
    generateLoader.classList.remove('hidden');
    generateCommentBtn.disabled = true;
    
    geminiOutput.value = '正在發送請求至 Google Sheets 後端處理中...';
    
    try {
      // Call GAS endpoint to handle Gemini AI generation (Real student name is masked inside GAS)
      const response = await callGAS({
        action: 'generateComments',
        seat: student.seat,
        name: student.name, // Will be replaced with placeholder by GAS to maintain privacy
        keywords: keywords,
        style: style,
        geminiModel: geminiModel,
        deepseekModel: 'none', // Disable DeepSeek generation on backend
        customPrompt: style === 'custom' ? appState.customPrompt : ''
      });
      
      const geminiRaw = response.gemini || '無 Gemini 生成結果';
      
      // 🔒 本地隱私還原：將 AI 回傳的「[學生姓名]」標記在本地還原為學生真實姓名後再展示
      geminiOutput.value = geminiRaw.replace(/\[學生姓名\]/g, student.name);
    } catch (error) {
      geminiOutput.value = `❌ 產生失敗：\n${error.message}`;
      console.error("AI Generation error via GAS:", error);
    } finally {
      generateLoader.classList.add('hidden');
      generateCommentBtn.disabled = false;
    }
  }

  // ==========================================
  // 6. Modal Controls & Forms
  // ==========================================
  
  function openModal(modal) {
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeModal(modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }

  // Open settings
  openSettingsBtn.addEventListener('click', () => {
    gasUrlInput.value = appState.gasUrl;
    customPromptInput.value = appState.customPrompt;
    openModal(settingsModal);
  });

  // Close Settings
  [closeSettingsModalBtn, cancelSettingsBtn].forEach(btn => {
    btn.addEventListener('click', () => closeModal(settingsModal));
  });

  // Save Settings
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    appState.gasUrl = gasUrlInput.value.trim();
    appState.customPrompt = customPromptInput.value.trim();
    
    localStorage.setItem('tw_gas_url', appState.gasUrl);
    localStorage.setItem('tw_custom_prompt', appState.customPrompt);
    
    closeModal(settingsModal);
    
    // Trigger Sync automatically
    syncRoster();
  });

  // Test GAS connection inside settings
  testGASConnectionBtn.addEventListener('click', async () => {
    const url = gasUrlInput.value.trim();
    if (!url) {
      alert('請先輸入 Google Apps Script URL。');
      return;
    }
    
    testGASConnectionBtn.disabled = true;
    testGASConnectionBtn.textContent = '連線測試中...';
    
    try {
      const response = await fetch(`${url}?action=getData&cb=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        if (data.students) {
          alert(`連線成功！\n成功讀取到學期別：${data.semesters.join(', ')}\n學生總人數：${data.students.length} 人`);
        } else {
          alert('連線成功，但回傳資料格式不正確，請確認 Google Sheet 是否設定無誤。');
        }
      } else {
        alert(`連線失敗。HTTP 狀態碼：${response.status}`);
      }
    } catch (err) {
      alert(`連線出錯，請確認 URL 填寫無誤且已發佈為「任何人」可存取：\n${err.message}`);
    } finally {
      testGASConnectionBtn.disabled = false;
      testGASConnectionBtn.textContent = '測試試算表連線';
    }
  });

  // Open Add Student Modal
  addStudentBtn.addEventListener('click', () => {
    // Propose next seat number automatically
    let nextSeatNum = 1;
    if (appState.students.length > 0) {
      const seats = appState.students.map(s => parseInt(s.seat)).filter(s => !isNaN(s));
      if (seats.length > 0) {
        nextSeatNum = Math.max(...seats) + 1;
      }
    }
    newStudentSeat.value = nextSeatNum;
    newStudentName.value = '';
    openModal(addStudentModal);
  });

  // Close Add Student
  [closeAddStudentModalBtn, cancelAddStudentBtn].forEach(btn => {
    btn.addEventListener('click', () => closeModal(addStudentModal));
  });

  // Submit Add Student Form
  addStudentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const seat = newStudentSeat.value.trim();
    const name = newStudentName.value.trim();
    
    addStudentLoader.classList.remove('hidden');
    submitAddStudentBtn.disabled = true;
    
    try {
      await callGAS({ action: 'addStudent', seat, name });
      closeModal(addStudentModal);
      await syncRoster(); // Reload full roster
      
      // Auto select newly created student
      loadStudentDetails(seat);
    } catch (error) {
      alert(`新增學生失敗：\n${error.message}`);
    } finally {
      addStudentLoader.classList.add('hidden');
      submitAddStudentBtn.disabled = false;
    }
  });

  // Open Add Semester Modal
  addSemesterBtn.addEventListener('click', () => {
    newSemesterName.value = '';
    openModal(addSemesterModal);
  });

  // Close Add Semester
  [closeAddSemesterModalBtn, cancelAddSemesterBtn].forEach(btn => {
    btn.addEventListener('click', () => closeModal(addSemesterModal));
  });

  // Submit Add Semester Form
  addSemesterForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const semName = newSemesterName.value.trim();
    
    addSemesterLoader.classList.remove('hidden');
    submitAddSemesterBtn.disabled = true;
    
    try {
      await callGAS({ action: 'addSemester', semester: semName });
      closeModal(addSemesterModal);
      appState.selectedSemester = semName; // Switch active semester to the new one
      await syncRoster(); // Reload data
    } catch (error) {
      alert(`新增學期失敗：\n${error.message}`);
    } finally {
      addSemesterLoader.classList.add('hidden');
      submitAddSemesterBtn.disabled = false;
    }
  });

  // ==========================================
  // 7. General UI Event Handlers & Core Init
  // ==========================================
  
  // Student Search
  studentSearchInput.addEventListener('input', () => {
    const val = studentSearchInput.value;
    clearSearchBtn.style.display = val ? 'block' : 'none';
    renderStudentList();
  });

  clearSearchBtn.addEventListener('click', () => {
    studentSearchInput.value = '';
    clearSearchBtn.style.display = 'none';
    renderStudentList();
    studentSearchInput.focus();
  });

  // Sheet Tab Selection Change
  sheetSelect.addEventListener('change', () => {
    appState.selectedSheet = sheetSelect.value;
    appState.selectedStudentSeat = ''; // Reset selected student when changing group
    welcomeView.style.display = 'flex';
    editorPanel.style.display = 'none';
    syncRoster(); // Reload full roster for the new sheet
  });
 
  // Semester Selection Dropdown Change
  semesterSelect.addEventListener('change', () => {
    appState.selectedSemester = semesterSelect.value;
    updateProgressMetrics();
    renderStudentList();
    updateCompleteSemesterButtonState();
    
    // If a student is currently active, reload their values for the new semester
    if (appState.selectedStudentSeat) {
      loadStudentDetails(appState.selectedStudentSeat);
    }
  });

  // Quick tag category tab switching
  tagsTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tagsTabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      appState.activeTagCategory = btn.dataset.category;
      renderQuickTags();
    });
  });

  // Clearing inputs in the workspace
  clearKeywordsBtn.addEventListener('click', () => {
    keywordsInput.value = '';
    keywordsInput.focus();
  });

  commentOutput.addEventListener('input', () => {
    // 🔒 當用戶貼入從 ChatGPT 網頁版產生包含「[學生姓名]」的評語時，自動在本地還原為真實姓名
    const student = appState.students.find(s => String(s.seat) === String(appState.selectedStudentSeat));
    if (student && commentOutput.value.includes('[學生姓名]')) {
      commentOutput.value = commentOutput.value.replace(/\[學生姓名\]/g, student.name);
    }
    updateWordCounter();
  });

  // Copy buttons
  function copyTextHelper(btn, textarea) {
    const text = textarea.value.trim();
    if (!text || text.startsWith('正在發送') || text.startsWith('❌')) return;
    
    navigator.clipboard.writeText(text).then(() => {
      const originalText = btn.textContent;
      btn.textContent = '✓ 已複製';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 1500);
    }).catch(err => console.error('Failed to copy: ', err));
  }

  copyCommentBtn.addEventListener('click', () => copyTextHelper(copyCommentBtn, commentOutput));
  copyGeminiBtn.addEventListener('click', () => copyTextHelper(copyGeminiBtn, geminiOutput));

  // Copy AI Prompt for ChatGPT Web Chat fallback (maintains student privacy)
  copyPromptBtn.addEventListener('click', () => {
    const student = appState.students.find(s => String(s.seat) === String(appState.selectedStudentSeat));
    if (!student) return;

    const keywords = keywordsInput.value.trim();
    if (!keywords) {
      alert('請先輸入或選擇日常表現關鍵詞！');
      return;
    }

    const style = promptStyleSelect.value;
    let promptTemplate = DEFAULT_PROMPTS[style];
    if (style === 'custom' && appState.customPrompt) {
      promptTemplate = appState.customPrompt;
    }
    if (!promptTemplate) {
      promptTemplate = DEFAULT_PROMPTS.warm;
    }

    // 🔒 隱私安全：將姓名替換為「[學生姓名]」以防隱私洩漏
    let finalPrompt = promptTemplate
      .replace(/{seat}/g, student.seat)
      .replace(/{name}/g, "[學生姓名]")
      .replace(/{keywords}/g, keywords);

    finalPrompt += "\n\n【特別安全規範：請在產生的評語中一律使用代稱「[學生姓名]」來代表學生的姓名，絕對不要提及或猜測學生的任何真實姓名。範例：『[學生姓名]這學期表現優異...』。】";

    navigator.clipboard.writeText(finalPrompt).then(() => {
      const originalText = copyPromptBtn.innerHTML;
      copyPromptBtn.innerHTML = '<span>✓ 已複製提問詞！可前往 ChatGPT 貼上</span>';
      copyPromptBtn.style.backgroundColor = 'var(--success-hover)';
      setTimeout(() => {
        copyPromptBtn.innerHTML = originalText;
        copyPromptBtn.style.backgroundColor = '';
      }, 2000);
    }).catch(err => {
      alert('複製失敗，請檢查權限或手動複製！');
      console.error(err);
    });
  });

  // Adoption Buttons
  adoptGeminiBtn.addEventListener('click', () => {
    const val = geminiOutput.value.trim();
    if (!val || val.startsWith('正在發送') || val.startsWith('❌')) return;
    commentOutput.value = val;
    updateWordCounter();
    
    // Visual click feedback
    adoptGeminiBtn.textContent = '✓ 已採用';
    setTimeout(() => { adoptGeminiBtn.textContent = '🎯 採用此版本'; }, 1000);
  });

  // Save to sheet
  saveCommentBtn.addEventListener('click', async () => {
    if (!appState.selectedStudentSeat) return;
    
    const keywords = keywordsInput.value.trim();
    const comment = commentOutput.value.trim();
    const seat = appState.selectedStudentSeat;
    const semester = appState.selectedSemester;
    
    saveLoader.classList.remove('hidden');
    saveCommentBtn.disabled = true;
    
    try {
      await callGAS({
        action: 'updateComment',
        seat,
        semester,
        keywords,
        comment
      });
      
      // Update local state directly to avoid a full fetch refresh
      const student = appState.students.find(s => String(s.seat) === String(seat));
      if (student) {
        if (!student.data[semester]) student.data[semester] = {};
        student.data[semester].keywords = keywords;
        student.data[semester].comment = comment;
      }
      
      // Update visual badges and progress metrics
      renderStudentList();
      updateProgressMetrics();
      loadStudentDetails(seat); // Reload status badges
      
      // Button success state feedback
      const originalBtnHtml = saveCommentBtn.innerHTML;
      saveCommentBtn.innerHTML = '✓ 成功儲存並同步！';
      saveCommentBtn.style.backgroundColor = 'var(--success-hover)';
      setTimeout(() => {
        saveCommentBtn.innerHTML = originalBtnHtml;
        saveCommentBtn.style.backgroundColor = '';
        saveCommentBtn.disabled = false;
      }, 2000);
      
    } catch (error) {
      alert(`儲存評語失敗：\n${error.message}`);
      saveCommentBtn.disabled = false;
      saveLoader.classList.add('hidden');
    }
  });

  // Trigger AI Generation Action (Dual AI)
  generateCommentBtn.addEventListener('click', generateAIComments);

  // Complete or Reopen this semester
  completeSemesterBtn.addEventListener('click', async () => {
    if (appState.semesters.length === 0) return;
    const currentSem = appState.selectedSemester;
    const isCompleted = appState.completedSemesters.includes(currentSem);
    
    if (isCompleted) {
      // Reopen flow
      completeSemesterBtn.disabled = true;
      completeSemesterBtn.innerHTML = '⏳ 正在重開學期...';
      
      try {
        const response = await callGAS({
          action: 'reopenSemester',
          semester: currentSem
        });
        
        // Update local state
        appState.completedSemesters = response.completedSemesters || [];
        
        // Re-render
        renderSemesterDropdown();
        updateCompleteSemesterButtonState();
        
        // Success feedback
        completeSemesterBtn.innerHTML = '🔓 學期已成功重開！';
        completeSemesterBtn.style.backgroundColor = 'var(--success-hover)';
      } catch (error) {
        alert(`重開學期失敗，請重試：\n${error.message}`);
        updateCompleteSemesterButtonState();
      } finally {
        setTimeout(() => {
          completeSemesterBtn.innerHTML = '🏁 完成此學期 (切換至下一學期)';
          completeSemesterBtn.style.backgroundColor = '';
          completeSemesterBtn.disabled = false;
          updateCompleteSemesterButtonState();
        }, 1500);
      }
    } else {
      // Complete flow
      const currentIndex = appState.semesters.indexOf(currentSem);
      if (currentIndex === -1) return;
      
      if (currentIndex + 1 < appState.semesters.length) {
        const nextSem = appState.semesters[currentIndex + 1];
        
        // Visual feedback while loading/saving to GAS
        completeSemesterBtn.disabled = true;
        completeSemesterBtn.innerHTML = '⏳ 正在同步設定至試算表...';
        
        try {
          const response = await callGAS({
            action: 'completeSemester',
            semester: currentSem,
            nextSemester: nextSem
          });
          
          // Update local state
          appState.completedSemesters = response.completedSemesters || [];
          appState.selectedSemester = nextSem;
          
          // Re-render dropdown and select new active semester
          renderSemesterDropdown();
          updateCompleteSemesterButtonState();
          
          // Update UI and trigger semester select change flow
          updateProgressMetrics();
          renderStudentList();
          
          if (appState.selectedStudentSeat) {
            loadStudentDetails(appState.selectedStudentSeat);
          }
          
          // Success feedback
          completeSemesterBtn.innerHTML = '🏁 已完成並切換至下一學期！';
          completeSemesterBtn.style.backgroundColor = 'var(--success-hover)';
        } catch (error) {
          alert(`無法同步完成狀態至試算表，請重試：\n${error.message}`);
          updateCompleteSemesterButtonState();
        } finally {
          setTimeout(() => {
            completeSemesterBtn.innerHTML = '🏁 完成此學期 (切換至下一學期)';
            completeSemesterBtn.style.backgroundColor = '';
            completeSemesterBtn.disabled = false;
            updateCompleteSemesterButtonState();
          }, 1500);
        }
      } else {
        alert(`目前「${appState.selectedSemester}」已經是最後一個學期了！\n若要新增下一個學期，請點選選單上方的「+ 新增學期」連結。`);
      }
    }
  });

  // Initialize flow
  function init() {
    renderQuickTags();       // Load quick tags list
    
    if (appState.gasUrl) {
      syncRoster();          // Pull student list
    } else {
      updateSyncIndicator('state-disconnected', '尚未設定試算表 URL');
      // Proactively open settings to guide the user
      setTimeout(() => {
        openSettingsBtn.click();
      }, 800);
    }
  }

  init();
});
