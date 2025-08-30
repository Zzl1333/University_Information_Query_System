let universityRankingChartChina = null;
let universityRankingChartWorld = null;

/**
 * 初始化并更新高校排名图表。
 * @param {object} rankingChina - 国内排名数据，键为年份，值为排名。
 * @param {object} rankingWorld - 世界排名数据，键为年份，值为排名。
 */
function initUniversityRankingCharts(rankingChina = {}, rankingWorld = {}) {
    const ctxChina = document.getElementById('universityRankingChartChina').getContext('2d');
    const ctxWorld = document.getElementById('universityRankingChartWorld').getContext('2d');

    if (universityRankingChartChina) universityRankingChartChina.destroy();
    if (universityRankingChartWorld) universityRankingChartWorld.destroy();

    const chinaYears = Object.keys(rankingChina).sort();
    const chinaValues = chinaYears.map(year => Number(rankingChina[year]));

    const worldYears = Object.keys(rankingWorld).sort();
    const worldValues = worldYears.map(year => Number(rankingWorld[year]));

    let worldMin = 0;
    let worldMax = 0;
    if (worldValues.length > 0) {
        const minRank = Math.min(...worldValues);
        const maxRank = Math.max(...worldValues);
        const range = maxRank - minRank;
        const margin = range * 0.2;
        worldMin = Math.max(1, Math.floor(minRank - margin));
        worldMax = Math.ceil(maxRank + margin);
    }

    universityRankingChartChina = new Chart(ctxChina, {
        type: 'line',
        data: {
            labels: chinaYears,
            datasets: [{
                label: '中国排名',
                data: chinaValues,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                tension: 0.3,
                borderWidth: 3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    reverse: true,
                    title: { display: true, text: '排名' }
                }
            },
            plugins: {
                title: {
                    display: false
                }
            }
        }
    });

    universityRankingChartWorld = new Chart(ctxWorld, {
        type: 'line',
        data: {
            labels: worldYears,
            datasets: [{
                label: '世界排名',
                data: worldValues,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.3,
                borderWidth: 3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    reverse: true,
                    title: { display: true, text: '排名' },
                    min: worldMin,
                    max: worldMax,
                    beginAtZero: false
                }
            },
            plugins: {
                title: {
                    display: false
                }
            }
        }
    });

    document.getElementById('universityRankingChartSection').style.display = 'block';
}

/**
 * 显示专业列表。
 * @param {Array} specialties - 专业数据数组。
 */
function displaySpecialtyList(specialties) {
    const specialtyListContent = document.getElementById('specialtyListContent');
    const specialtyListSection = document.getElementById('specialtyListSection');
    const noSpecialtyDataMessage = document.getElementById('noSpecialtyDataMessage');

    specialtyListContent.innerHTML = '';
    noSpecialtyDataMessage.classList.add('hidden');

    if (!specialties || specialties.length === 0) {
        noSpecialtyDataMessage.classList.remove('hidden');
        specialtyListSection.style.display = 'block';
        return;
    }

    specialties.forEach(spec => {
        const specItem = document.createElement('div');
        specItem.className = 'bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200';
        specItem.innerHTML = `
            <div class="font-bold text-blue-700 text-lg mb-1">${spec.specialty_name || 'N/A'}</div>
            <div class="text-gray-700 text-sm">
                评分: <span class="font-semibold text-blue-600">${spec.rating || 'N/A'}</span>
            </div>
            <div class="text-gray-700 text-sm mt-1">
                当前排名: <span class="font-semibold text-blue-600">${spec.specialty_ranking || 'N/A'}</span>
            </div>
        `;
        specialtyListContent.appendChild(specItem);
    });

    specialtyListSection.style.display = 'block';
}

/**
 * 更新页面上的统计数据。
 */
function updateStats() {
    document.getElementById('uniCount').textContent = '1000+';
    document.getElementById('majorCount').textContent = '800+';
    document.getElementById('userCount').textContent = '0';
    document.getElementById('successRate').textContent = '100%';
}

/**
 * 切换 AI 咨询窗口的显示状态。
 */
function toggleAI() {
    const aiWindow = document.getElementById('aiWindow');
    aiWindow.classList.toggle('hidden');

    if (!aiWindow.classList.contains('hidden')) {
        setTimeout(() => {
            const chatLog = document.getElementById('aiChatLog');
            chatLog.scrollTop = chatLog.scrollHeight;
        }, 100);
    }
}

/**
 * 切换管理员登录窗口的显示状态。
 */
function toggleAdmin() {
    document.getElementById('adminWindow').classList.toggle('hidden');
}

/**
 * 处理搜索输入框的 Enter 键事件。
 * @param {Event} event - 键盘事件对象。
 */
function handleSearchKeyPress(event) {
    if (event.key === 'Enter') {
        searchUniversity();
    }
}

/**
 * 根据输入的大学名称和省份查询高校信息。
 */
async function searchUniversity() {
    const name = document.getElementById('searchName').value.trim();
    const province = document.getElementById('searchProvince').value.trim();

    if (!name && !province) {
        alert('请输入大学名称或省份进行查询');
        return;
    }

    const container = document.getElementById('universityCards');
    container.innerHTML = `
        <div class="col-span-3 text-center py-10">
            <div class="loader mx-auto mb-4"></div>
            <p class="text-blue-600 font-medium">正在查询高校数据...</p>
        </div>
    `;
    document.getElementById('universityRankingChartSection').style.display = 'none';
    document.getElementById('specialtyListSection').style.display = 'none';

    try {
        const response = await fetch(`/api/university?name=${encodeURIComponent(name)}&province=${encodeURIComponent(province)}`);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || '查询失败');
        }

        const universities = await response.json();

        document.getElementById('resultCount').textContent = universities.length;

        container.innerHTML = '';

        if (universities.length === 0) {
            container.innerHTML = `
                <div class="col-span-3 text-center py-10">
                    <i class="fas fa-info-circle text-gray-500 text-4xl mb-3"></i>
                    <p class="text-gray-600 font-medium">未找到相关高校信息。</p>
                </div>
            `;
        } else {
            universities.forEach(uni => {
                const card = createUniversityCard(uni);
                container.appendChild(card);
            });

            if (universities.length === 1) {
                const uni = universities[0];
                if (uni.ranking_china && Object.keys(uni.ranking_china).length > 0) {
                    initUniversityRankingCharts(uni.ranking_china, uni.ranking_world || {});
                } else {
                    document.getElementById('universityRankingChartSection').style.display = 'none';
                }
                displaySpecialtyList(uni.specialties);
            } else {
                document.getElementById('universityRankingChartSection').style.display = 'none';
                document.getElementById('specialtyListSection').style.display = 'none';
            }
        }
    } catch (error) {
        container.innerHTML = `
            <div class="col-span-3 text-center py-10">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-3"></i>
                <p class="text-red-600 font-medium">${error.message || '查询过程中发生错误'}</p>
            </div>
        `;
         document.getElementById('universityRankingChartSection').style.display = 'none';
         document.getElementById('specialtyListSection').style.display = 'none';
    }
}

/**
 * 获取字典中最新年份的条目。
 * @param {object} dataDict - 包含年份作为键的字典。
 * @returns {any|null} 最新年份的条目或 null。
 */
function getLatestEntry(dataDict) {
    if (!dataDict || typeof dataDict !== 'object') return null;
    const years = Object.keys(dataDict).map(y => parseInt(y)).sort((a, b) => b - a);
    if (years.length === 0) return null;
    return dataDict[years[0]];
}

/**
 * 获取排名字典中最新年份的排名值。
 * @param {object} rankingDict - 包含年份作为键的排名字典。
 * @returns {{year: number, ranking: any}|null} 最新年份和排名或 null。
 */
function getLatestRankingValue(rankingDict) {
    if (!rankingDict || typeof rankingDict !== 'object') return null;
    const years = Object.keys(rankingDict).map(y => parseInt(y)).sort((a, b) => b - a);
    const latestYear = years[0];
    return latestYear ? { year: latestYear, ranking: rankingDict[latestYear] } : null;
}

/**
 * 创建一个大学信息卡片。
 * @param {object} uni - 大学数据对象。
 * @returns {HTMLElement} 大学卡片元素。
 */
function createUniversityCard(uni) {
    const card = document.createElement('div');
    card.className = 'card fade-in';

    let tags = '';
    const titleList = typeof uni.title === 'string' && uni.title ? uni.title.split(',') : [];
    tags = titleList.map(tag => `<span class="tag">${tag.trim()}</span>`).join('');

    let chinaRanking = '暂无数据';
    const latestChina = getLatestRankingValue(uni.ranking_china);
    if (latestChina) {
        chinaRanking = `${latestChina.ranking} (${latestChina.year}年)`;
    }

    let worldRanking = '暂无数据';
    const latestWorld = getLatestRankingValue(uni.ranking_world);
    if (latestWorld) {
        worldRanking = `${latestWorld.ranking} (${latestWorld.year}年)`;
    }

    let topSpecialties = '';
    if (Array.isArray(uni.specialties) && uni.specialties.length > 0) {
        uni.specialties.slice(0, 3).forEach(spec => {
            if (spec.specialty_name) {
                topSpecialties += `
                    <div class="text-sm">
                        ${spec.specialty_name}
                        <span class="text-blue-600">(${spec.rating || 'N/A'})</span>
                        ${spec.specialty_ranking && spec.specialty_ranking !== 'N/A'
                            ? `<span class="text-gray-500"> - 排名${spec.specialty_ranking}</span>`
                            : ''}
                    </div>`;
            }
        });
    }

    card.innerHTML = `
        <div class="bg-gray-100 flex items-center justify-center h-48">
            <img src="${(uni.photo && uni.photo[0]) || 'https://via.placeholder.com/100x100?text=No+Logo'}" class="h-24" alt="校徽"/>
        </div>
        <div class="p-5">
            <div class="flex justify-between items-start mb-3">
                <h3 class="font-bold text-xl text-gray-800">${uni.university_name || '未知名称'}</h3>
                <span class="ranking-badge">${latestChina ? '# ' + latestChina.ranking : '排名未知'}</span>
            </div>
            <div class="flex flex-wrap mb-3">${tags}</div>
            <div class="flex items-center text-gray-600 mb-2">
                <i class="fas fa-map-marker-alt mr-2 text-blue-500"></i>
                <span>${uni.location || '未知地区'}</span>
            </div>
            <div class="text-gray-600 text-sm mb-4 line-clamp-3">${uni.history || '暂无学校简介'}</div>
            <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <div class="font-medium text-gray-700">${uni.kind_ranking}</div>
                    <div class="font-bold text-lg text-blue-600">${chinaRanking}</div>
                </div>
                <div>
                    <div class="font-medium text-gray-700">世界排名</div>
                    <div class="font-bold text-lg text-blue-600">${worldRanking}</div>
                </div>
            </div>
            <div class="mb-4">
                <div class="font-medium text-gray-700">热门专业</div>
                ${topSpecialties || '<div class="text-sm text-gray-500">暂无专业数据</div>'}
            </div>
            <a href="${uni.official_website && uni.official_website !== 'N/A' ? uni.official_website : '#'}" target="_blank" class="btn-primary inline-flex items-center justify-center px-4 py-2 w-full text-center">
                <i class="fas fa-globe mr-2"></i>访问官网
            </a>
        </div>
    `;
    return card;
}

/**
 * 发送 AI 咨询消息。
 */
async function sendAI() {
    const input = document.getElementById('aiInput');
    const log = document.getElementById('aiChatLog');
    const question = input.value.trim();
    if (!question) return;

    log.innerHTML += `
        <div class="user-message p-3 text-sm">
            <div class="font-bold mb-1">您</div>
            <div>${question}</div>
        </div>
    `;
    input.value = '';

    log.scrollTop = log.scrollHeight;

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question })
        });

        if (!response.ok) {
            throw new Error('AI服务暂不可用');
        }

        const data = await response.json();

        log.innerHTML += `
            <div class="ai-message p-3 text-sm">
                <div class="font-bold text-blue-600 mb-1">AI助手</div>
                <div>${data.reply || '暂时无法回答此问题'}</div>
            </div>
        `;
    } catch (error) {
        log.innerHTML += `
            <div class="ai-message p-3 text-sm">
                <div class="font-bold text-blue-600 mb-1">AI助手</div>
                <div class="text-red-500">${error.message || '处理您的请求时出错'}</div>
            </div>
        `;
    }

    log.scrollTop = log.scrollHeight;
}

/**
 * 管理员登录功能。
 */
async function loginAdmin() {
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    const errorText = document.getElementById('adminError');

    if (!username || !password) {
        errorText.textContent = '请输入用户名和密码';
        errorText.classList.remove('hidden');
        return;
    }

    try {
        const response = await fetch('/admin/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            document.getElementById('adminWindow').classList.add('hidden');
            errorText.classList.add('hidden');
            window.open(data.redirect_url, '_blank');
        } else {
            errorText.textContent = data.message || '用户名或密码错误';
            errorText.classList.remove('hidden');
        }
    } catch (error) {
        errorText.textContent = '登录请求失败，请检查网络连接';
        errorText.classList.remove('hidden');
    }
}

/**
 * 填充大学名称建议列表。
 * @param {string} query - 用户输入的查询字符串。
 */
async function populateUniversitySuggestions(query) {
    const datalist = document.getElementById('universitySuggestions');
    datalist.innerHTML = ''; // 清除之前的建议

    if (query.length < 2) { // 只有当查询至少包含2个字符时才获取建议
        return;
    }

    const dummySuggestions = [
        "清华大学", "北京大学", "复旦大学", "上海交通大学", "浙江大学",
        "南京大学", "武汉大学", "华中科技大学", "四川大学", "中山大学"
    ].filter(name => name.includes(query));

    dummySuggestions.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        datalist.appendChild(option);
    });
}

// 页面加载完成后执行的初始化代码
document.addEventListener('DOMContentLoaded', () => {
    updateStats();

    const adminWindow = document.getElementById('adminWindow');
    const toggleBtn = document.getElementById('adminToggleBtn');
    const closeBtn = document.getElementById('adminCloseBtn');
    const searchNameInput = document.getElementById('searchName');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            adminWindow.classList.toggle('hidden');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            adminWindow.classList.add('hidden');
        });
    }

    document.getElementById('searchName').addEventListener('keypress', handleSearchKeyPress);
    document.getElementById('searchProvince').addEventListener('keypress', handleSearchKeyPress);
    document.getElementById('aiInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendAI();
        }
    });

    // 为搜索名称输入框添加输入事件监听器，以填充建议
    searchNameInput.addEventListener('input', (event) => {
        populateUniversitySuggestions(event.target.value);
    });

    const adminTokenInput = document.getElementById('adminToken');
    const togglePasswordIcon = document.getElementById('togglePassword');

    if (togglePasswordIcon && adminTokenInput) {
        togglePasswordIcon.addEventListener('click', () => {
            const type = adminTokenInput.getAttribute('type') === 'password' ? 'text' : 'password';
            adminTokenInput.setAttribute('type', type);

            // 眼睛图标
            togglePasswordIcon.classList.toggle('fa-eye');
            togglePasswordIcon.classList.toggle('fa-eye-slash');
        });
    }
});