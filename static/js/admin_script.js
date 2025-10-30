const API_BASE_URL = '/admin/api';
let basic_page = 1
let universityCurrentPage = 1; // Specific page counter for university management
let majorCurrentPage = 1;      // Specific page counter for major management
const recordsPerPage = 10;     // Default records per page, matches backend default

// Function to show toast notification
function showToast(message, type = 'success') {
    let toast = document.getElementById('toastNotification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toastNotification';
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
    }

    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'info-circle'} mr-2"></i>${message}`;
    toast.style.backgroundColor = type === 'success' ? '#4CAF50' : '#FFC107'; // Green for success, Yellow for info
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Generic function to open a modal
function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

// Generic function to close a modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Function to render university management content
async function renderUniversityManagementContent() {
    const dynamicContentDiv = document.getElementById('dynamicContent');
    dynamicContentDiv.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">高校管理</h2>
            <div class="flex space-x-4">
                <div class="action-dropdown">
                    <button id="addUniversityBtn" class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg flex items-center operation-btn">
                        <i class="fas fa-plus mr-2"></i>新增高校
                    </button>

                </div>
                <button class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center operation-btn" id="refreshDataBtn">
                    <i class="fas fa-sync-alt mr-2"></i>
                </button>
            </div>
        </div>

        <div class="mb-6 flex items-center">
            <div class="relative w-64">
                <input type="text" id="searchUniversityInput" placeholder="搜索高校名称..." class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>
            <div class="ml-4">
                <select id="provinceFilterSelect" class="py-2 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">按省份筛选</option>
                    <option value="北京市">北京市</option>
                    <option value="天津市">天津市</option>
                    <option value="上海市">上海市</option>
                    <option value="重庆市">重庆市</option>
                    <option value="河北省">河北省</option>
                    <option value="山西省">山西省</option>
                    <option value="辽宁省">辽宁省</option>
                    <option value="吉林省">吉林省</option>
                    <option value="黑龙江省">黑龙江省</option>
                    <option value="江苏省">江苏省</option>
                    <option value="浙江省">浙江省</option>
                    <option value="安徽省">安徽省</option>
                    <option value="福建省">福建省</option>
                    <option value="江西省">江西省</option>
                    <option value="山东省">山东省</option>
                    <option value="河南省">河南省</option>
                    <option value="湖北省">湖北省</option>
                    <option value="湖南省">湖南省</option>
                    <option value="广东省">广东省</option>
                    <option value="海南省">海南省</option>
                    <option value="四川省">四川省</option>
                    <option value="贵州省">贵州省</option>
                    <option value="云南省">云南省</option>
                    <option value="陕西省">陕西省</option>
                    <option value="甘肃省">甘肃省</option>
                    <option value="青海省">青海省</option>
                    <option value="台湾省">台湾省</option>
                    <option value="内蒙古自治区">内蒙古自治区</option>
                    <option value="广西壮族自治区">广西壮族自治区</option>
                    <option value="西藏自治区">西藏自治区</option>
                    <option value="宁夏回族自治区">宁夏回族自治区</option>
                    <option value="新疆维吾尔自治区">新疆维吾尔自治区</option>
                    <option value="香港特别行政区">香港特别行政区</option>
                    <option value="澳门特别行政区">澳门特别行政区</option>
                </select>
            </div>
        </div>

        <div class="overflow-x-auto rounded-lg border border-gray-200">
            <table class="min-w-full bg-white" id="universityTable">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="py-3 px-4 text-left font-semibold text-gray-700">ID</th>
                        <th class="py-3 px-4 text-left font-semibold text-gray-700">高校名称</th>
                        <th class="py-3 px-4 text-left font-semibold text-gray-700">省份</th>

                        <th class="py-3 px-4 text-left font-semibold text-gray-700">排名</th>
                        <th class="py-3 px-4 text-left font-semibold text-gray-700">状态</th>
                        <th class="py-3 px-4 text-left font-semibold text-gray-700">操作</th>
                    </tr>
                </thead>
                <tbody>
                    </tbody>
            </table>
        </div>

        <div class="mt-6 flex justify-between items-center">
            <div class="text-sm text-gray-600">
                显示 <span id="currentPageStart">0</span> 到 <span id="currentPageEnd">0</span> 条，共 <span id="totalRecords">0</span> 条记录
            </div>
            <div class="flex space-x-2">
                <button class="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" id="prevPageBtn">
                    上一页
                </button>
                <div id="paginationButtons" class="flex space-x-2">
                    </div>
                <button class="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" id="nextPageBtn">
                    下一页
                </button>
            </div>
        </div>
    `;
    // Re-attach event listeners after content is loaded
    attachUniversityManagementListeners();
    // Load universities for the first time
    renderUniversityTable();
}

// Function to render university table (fetches from backend)
async function renderUniversityTable() {
    const tableBody = document.querySelector('#universityTable tbody');
    const searchInput = document.getElementById('searchUniversityInput');
    const provinceFilterSelect = document.getElementById('provinceFilterSelect');
    // const typeFilterSelect = document.getElementById('typeFilterSelect'); // Not supported by backend models - Removed

    const searchQuery = searchInput ? searchInput.value : '';
    const provinceFilter = provinceFilterSelect ? provinceFilterSelect.value : '';
    // const typeFilter = typeFilterSelect ? typeFilterSelect.value : ''; // Removed

    const params = new URLSearchParams({
        page: universityCurrentPage, // Use university-specific page counter
        per_page: recordsPerPage,
        search: searchQuery,
        province: provinceFilter
        // type: typeFilter // Uncomment if 'type' is added to backend model - Removed
    });

    try {
        const response = await fetch(`${API_BASE_URL}/universities?${params.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const universities = data.universities;
        const totalRecords = data.total;
        const totalPages = data.total_pages;

        tableBody.innerHTML = ''; // Clear existing rows

        if (universities.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-gray-500">没有找到相关高校。</td></tr>`;
        } else {
            universities.forEach(university => {
                const row = document.createElement('tr');
                row.className = 'university-row border-b border-gray-200';
                row.innerHTML = `
                    <td class="py-3 px-4">${university.id}</td>
                    <td class="py-3 px-4 font-medium">${university.name}</td>
                    <td class="py-3 px-4">${university.location}</td>
                    <td class="py-3 px-4">${university.rank}</td>
                    <td class="py-3 px-4">
                        <span class="px-3 py-1 rounded-full text-xs ${university.status === '已入库' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                            ${university.status}
                        </span>
                    </td>
                    <td class="py-3 px-4">
                        <button class="edit-btn mr-2 text-blue-500 hover:text-blue-700" data-id="${university.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn text-red-500 hover:text-red-700" data-id="${university.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
        updateUniversityPaginationInfo(totalRecords, totalPages); // Renamed for clarity
        attachUniversityTableButtonListeners(); // Renamed for clarity
    } catch (error) {
        console.error('Error fetching universities:', error);
        showToast('获取高校数据失败，请稍后再试。', 'error');
        tableBody.innerHTML = `<tr><td colspan="7" class="py-4 text-center text-red-500">加载数据失败。</td></tr>`;
    }
}

// Function to update university pagination information (renamed)
function updateUniversityPaginationInfo(totalRecords, totalPages) {
    document.getElementById('totalRecords').textContent = totalRecords;
    document.getElementById('currentPageStart').textContent = Math.min(totalRecords, (universityCurrentPage - 1) * recordsPerPage + 1);
    document.getElementById('currentPageEnd').textContent = Math.min(totalRecords, universityCurrentPage * recordsPerPage);

    const paginationButtonsContainer = document.getElementById('paginationButtons');
    paginationButtonsContainer.innerHTML = '';

    document.getElementById('prevPageBtn').disabled = universityCurrentPage === 1;

    const maxPagesToShow = 5;
    let startPage = Math.max(1, universityCurrentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
        paginationButtonsContainer.innerHTML += `
            <button class="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" data-page="1">1</button>
            <span class="px-2 py-1">...</span>
        `;
    }

    for (let i = startPage; i <= endPage; i++) {
        paginationButtonsContainer.innerHTML += `
            <button class="px-3 py-1 rounded border ${i === universityCurrentPage ? 'border-blue-500 bg-blue-500 text-white' : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'}" data-page="${i}">
                ${i}
            </button>
        `;
    }

    if (endPage < totalPages) {
        paginationButtonsContainer.innerHTML += `
            <span class="px-2 py-1">...</span>
            <button class="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50" data-page="${totalPages}">${totalPages}</button>
        `;
    }

    document.getElementById('nextPageBtn').disabled = universityCurrentPage === totalPages || totalRecords === 0;

    paginationButtonsContainer.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', function() {
            universityCurrentPage = parseInt(this.getAttribute('data-page'));
            renderUniversityTable();
        });
    });
}

// Attach listeners specific to University Management content
function attachUniversityManagementListeners() {
    // Modal Controls (re-attach as they are part of dynamic content)
    const addUniversityModal = document.getElementById('addUniversityModal');
    const editUniversityModal = document.getElementById('editUniversityModal');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');

    document.getElementById('addUniversityBtn').addEventListener('click', function(e) {
        e.preventDefault();
        openModal('addUniversityModal');
    });
    document.getElementById('closeAddModal').addEventListener('click', () => closeModal('addUniversityModal'));
    document.getElementById('closeEditModal').addEventListener('click', () => closeModal('editUniversityModal'));
    document.getElementById('closeDeleteModal').addEventListener('click', () => closeModal('deleteConfirmModal'));

    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === addUniversityModal) closeModal('addUniversityModal');
        if (event.target === editUniversityModal) closeModal('editUniversityModal');
        if (event.target === deleteConfirmModal) closeModal('deleteConfirmModal');
    });

    document.getElementById('addUniversityForm').addEventListener('submit', async function(e) {
         e.preventDefault();
    const universityName = document.getElementById('newUniversityName').value;

    try {
    // 修改请求 URL 为正确的地址
         const response = await fetch(`/app/api/universities_1`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ name: universityName })
    });
          const result = await response.json();
    if (response.ok) {
         showToast(result.message);
          closeModal('addUniversityModal');
    this.reset();
          currentPage = 1; // Go back to first page after adding
         renderUniversityTable();
         showToast(result.message || '爬取高校数据成！', 'success');
    } else {
         showToast(result.message || '爬取高校数据失败！', 'error');
    }
    } catch (error) {
         console.error('Error crawling university data:', error);
         showToast('爬取高校数据失败，请检查网络或服务器。', 'error');
      }
    });

    // Handle Edit University Form Submission
    document.getElementById('editUniversityForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const idToUpdate = document.getElementById('editUniversityId').value; // This is university_name
        const updatedUniversity = {
            id: idToUpdate, // Send university_name as 'id'
            location: document.getElementById('editUniversityProvince').value,
            // type: document.getElementById('editUniversityType').value, // Not stored in current backend - Removed
            rank: parseInt(document.getElementById('editUniversityRank').value) || null,
            is_active: document.getElementById('editIsActive').checked // Not stored in current backend - Retained if needed
        };

        try {
            const response = await fetch(`${API_BASE_URL}/universities`, { // Backend uses PUT on /universities with ID in body
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedUniversity)
            });
            const result = await response.json();
            if (response.ok) {
                showToast(result.message);
                closeModal('editUniversityModal');
                renderUniversityTable();
            } else {
                showToast(result.message || '更新高校信息失败！', 'error');
            }
        } catch (error) {
            console.error('Error updating university:', error);
            showToast('更新高校信息失败，请检查网络或服务器。', 'error');
        }
    });

    // Handle Delete Confirmation
    document.getElementById('confirmDeleteBtn').addEventListener('click', async function() {
        const idToDelete = document.getElementById('deleteUniversityId').value; // This is university_name

        try {
            const response = await fetch(`${API_BASE_URL}/universities`, { // Backend uses DELETE on /universities with ID in body
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: idToDelete }) // Send university_name as 'id'
            });
            const result = await response.json();
            if (response.ok) {
                showToast(result.message);
                closeModal('deleteConfirmModal');
                universityCurrentPage = 1; // Go back to first page after deleting
                renderUniversityTable();
            } else {
                showToast(result.message || '删除高校失败！', 'error');
            }
        } catch (error) {
            console.error('Error deleting university:', error);
            showToast('删除高校失败，请检查网络或服务器。', 'error');
        }
    });

    // Refresh Data Button
    document.getElementById('refreshDataBtn').addEventListener('click', function() {
        showToast('数据已刷新！');
        renderUniversityTable(); // Re-fetch to simulate refresh
    });

    // Search and Filter Listeners
    document.getElementById('searchUniversityInput').addEventListener('input', () => {
        universityCurrentPage = 1;
        renderUniversityTable();
    });
    document.getElementById('provinceFilterSelect').addEventListener('change', () => {
        universityCurrentPage = 1;
        renderUniversityTable();
    });
    // document.getElementById('typeFilterSelect').addEventListener('change', () => { // Uncomment if 'type' filter is supported by backend - Removed
    //     universityCurrentPage = 1;
    //     renderUniversityTable();
    // });

    // Pagination controls
    document.getElementById('prevPageBtn').addEventListener('click', () => {
        if (universityCurrentPage > 1) {
            universityCurrentPage--;
            renderUniversityTable();
        }
    });

    document.getElementById('nextPageBtn').addEventListener('click', () => {
        // Total pages is received from backend in renderUniversityTable, need to retrieve it.
        // For now, rely on `nextPageBtn.disabled` set by updateUniversityPaginationInfo.
        // A more robust way would be to store totalPages globally or pass it.
        universityCurrentPage++; // Increment and let updateUniversityPaginationInfo handle disabling if needed
        renderUniversityTable(); // This will re-evaluate pagination buttons
    });
}

// Function to attach listeners to dynamically created table buttons (Edit/Delete) (renamed)
function attachUniversityTableButtonListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.onclick = async function() {
            const id = this.getAttribute('data-id'); // This is university_name
            try {
                // Fetch the specific university's data if needed, or assume table has enough info
                // For simplicity, pre-fill from table data, but a direct fetch could be more robust
                // (e.g., fetch(`${API_BASE_URL}/universities/${id}`)) if a specific GET /universities/<name> endpoint existed.
                // Since backend GET is for all, we rely on the displayed data for pre-fill.
                const row = this.closest('tr');
                const universityName = row.children[1].textContent;
                const province = row.children[2].textContent;
                // const type = row.children[3].textContent; // This was incorrectly pulling rank, and 'type' is now removed
                const rank = row.children[3].textContent === '暂无' ? '' : parseInt(row.children[3].textContent); // Adjusted index
                const status = row.children[4].textContent.includes('已入库'); // Adjusted index

                document.getElementById('editUniversityId').value = id; // university_name
                document.getElementById('editUniversityName').value = universityName;
                document.getElementById('editUniversityProvince').value = province;
                // document.getElementById('editUniversityType').value = type; // Removed
                document.getElementById('editUniversityRank').value = rank;
                document.getElementById('editIsActive').checked = status;
                openModal('editUniversityModal');

            } catch (error) {
                console.error('Error preparing edit modal:', error);
                showToast('无法加载高校信息，请稍后再试。', 'error');
            }
        };
    });

    // Delete buttons
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.onclick = function() {
            const id = this.getAttribute('data-id'); // This is university_name
            document.getElementById('deleteUniversityId').value = id;
            openModal('deleteConfirmModal');
        };
    });
}

// --- NEW Major Management Functions ---

// Function to fetch and populate filter dropdowns for Major Management
async function populateMajorFilters() {
    const universityFilterSelect = document.getElementById('universityFilterSelect');
    const majorCategoryFilterSelect = document.getElementById('majorCategoryFilterSelect');

    // Fetch Universities for the "所属高校" filter
    try {
        const response = await fetch(`${API_BASE_URL}/universities?per_page=9999`); // Fetch all universities for filter
        if (response.ok) {
            const data = await response.json();
            const universities = data.universities;
            let optionsHtml = '<option value="">按所属高校筛选</option>';
            universities.forEach(uni => {
                optionsHtml += `<option value="${uni.name}">${uni.name}</option>`;
            });
            universityFilterSelect.innerHTML = optionsHtml;
        } else {
            console.error('Failed to fetch universities for major filter:', response.statusText);
            showToast('无法加载高校列表进行筛选。', 'error');
        }
    } catch (error) {
        console.error('Error fetching universities for major filter:', error);
        showToast('加载高校列表失败，请检查网络或服务器。', 'error');
    }

    // Populate Major Categories (assuming a fixed list or fetched from another endpoint if available)
    // For now, using a hardcoded list. If there's an API endpoint for categories, use it.
    const majorCategories = [
        "工学", "理学", "文学", "经济学", "管理学", "法学", "教育学", "历史学", "农学", "医学", "艺术学", "军事学"
    ]; // Example categories
    let categoryOptionsHtml = '<option value="">按类别筛选</option>';
    majorCategories.forEach(category => {
        categoryOptionsHtml += `<option value="${category}">${category}</option>`;
    });
    majorCategoryFilterSelect.innerHTML = categoryOptionsHtml;

    // You might need to fetch categories from an API like this:
    // try {
    //     const categoryResponse = await fetch(`${API_BASE_URL}/major_categories`);
    //     if (categoryResponse.ok) {
    //         const categories = await categoryResponse.json();
    //         let categoryOptionsHtml = '<option value="">按类别筛选</option>';
    //         categories.forEach(category => {
    //             categoryOptionsHtml += `<option value="${category}">${category}</option>`;
    //         });
    //         majorCategoryFilterSelect.innerHTML = categoryOptionsHtml;
    //     } else {
    //         console.error('Failed to fetch major categories:', categoryResponse.statusText);
    //     }
    // } catch (error) {
    //     console.error('Error fetching major categories:', error);
    // }
}


// Function to render major management content


// Function to render major table (fetches from backend)


// Functions to fetch and render content for other modules
async function fetchAndRenderModule(moduleName, apiEndpoint) {
    const dynamicContentDiv = document.getElementById('dynamicContent');
    dynamicContentDiv.innerHTML = `<h2 class="text-2xl font-bold text-gray-800 mb-6">${moduleName}</h2><p class="text-gray-700">正在加载 ${moduleName} 数据...</p>`;

    try {
        // Handle '专业管理' by calling its dedicated render function
        if (moduleName === '专业管理') {
            renderMajorManagementContent();
            return; // Exit as content is rendered by the specific function
        }
        if (moduleName === '用户管理') {
        renderUserManagementContent();
        return;
        }

        const response = await fetch(`${API_BASE_URL}${apiEndpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        let contentHtml = `<h2 class="text-2xl font-bold text-gray-800 mb-6">${moduleName}</h2>`;

        switch (moduleName) {
            case '系统概览':
                contentHtml += `
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div class="data-card p-6 flex items-center">
                            <i class="fas fa-university text-4xl text-blue-500 mr-4"></i>
                            <div>
                                <p class="text-gray-500">总高校数量</p>
                                <p class="text-3xl font-bold text-gray-900">${data.universities}</p>
                            </div>
                        </div>
                        <div class="data-card p-6 flex items-center">
                            <i class="fas fa-book-open text-4xl text-green-500 mr-4"></i>
                            <div>
                                <p class="text-gray-500">总专业数量</p>
                                <p class="text-3xl font-bold text-gray-900">${data.majors}</p>
                            </div>
                        </div>
                        <div class="data-card p-6 flex items-center">
                            <i class="fas fa-chart-bar text-4xl text-purple-500 mr-4"></i>
                            <div>
                                <p class="text-gray-500">今日访问量</p>
                                <p class="text-3xl font-bold text-gray-900">${data.visits_today}</p>
                            </div>
                        </div>
                        <div class="data-card p-6 flex items-center">
                            <i class="fas fa-spider text-4xl text-gray-600 mr-4"></i>
                            <div>
                                <p class="text-gray-500">爬虫状态</p>
                                <p class="text-xl font-bold text-gray-900 status-tag-${data.spider_status === '运行中' ? 'running' : 'normal'}">${data.spider_status}</p>
                            </div>
                        </div>
                        <div class="data-card p-6 flex items-center">
                            <i class="fas fa-brain text-4xl text-yellow-500 mr-4"></i>
                            <div>
                                <p class="text-gray-500">模型状态</p>
                                <p class="text-xl font-bold text-gray-900 status-tag-${data.model_status === '已加载' ? 'loaded' : 'normal'}">${data.model_status}</p>
                            </div>
                        </div>
                        <div class="data-card p-6 flex items-center">
                            <i class="fas fa-database text-4xl text-indigo-500 mr-4"></i>
                            <div>
                                <p class="text-gray-500">数据库状态</p>
                                <p class="text-xl font-bold text-gray-900 status-tag-loaded">${data.db_status}</p>
                            </div>
                        </div>
                    </div>
                    <div class="mt-8">
                        <h3 class="text-xl font-bold text-gray-800 mb-4">数据趋势</h3>
                        <div class="bg-gray-50 p-6 rounded-lg shadow-inner">
                            <canvas id="overviewChart"></canvas>
                        </div>
                    </div>
                `;
                dynamicContentDiv.innerHTML = contentHtml; // Update content before chart init
                const ctxOverview = document.getElementById('overviewChart');
                if (ctxOverview) {
                    new Chart(ctxOverview, {
                        type: 'line',
                        data: {
                            labels: ['一月', '二月', '三月', '四月', '五月', '六月'], // Mock labels
                            datasets: [{
                                label: '新增高校',
                                data: [5, 10, 8, 15, 12, 20], // Mock data
                                borderColor: 'rgb(59, 130, 246)',
                                tension: 0.1
                            }, {
                                label: '新增专业',
                                data: [15, 20, 25, 18, 30, 22], // Mock data
                                borderColor: 'rgb(16, 185, 129)',
                                tension: 0.1
                            }]
                        },
                        options: { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: '每月数据增长趋势' } } }
                    });
                }
                break;
            // The '专业管理' case is now removed from here, handled by renderMajorManagementContent directly.
            case '数据统计':
                contentHtml += `
                    <p class="text-gray-700">这里是数据统计和分析的图表区域。</p>
                    <div class="mt-6 bg-gray-50 p-6 rounded-lg shadow-inner">
                        <canvas id="statsChart"></canvas>
                    </div>
                `;
                dynamicContentDiv.innerHTML = contentHtml;
                const statsCtx = document.getElementById('statsChart');
                if (statsCtx) {
                    new Chart(statsCtx, {
                        type: 'bar',
                        data: {
                            labels: data.university_distribution.labels,
                            datasets: [{
                                label: '高校数量',
                                data: data.university_distribution.data,
                                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                                borderColor: 'rgba(54, 162, 235, 1)',
                                borderWidth: 1
                            }]
                        },
                        options: { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: '各省高校数量分布' } }, scales: { y: { beginAtZero: true } } }
                    });
                }
                break;
            case '用户管理':
                try {
                    // 获取用户数据
                    const response = await fetch(`${API_BASE_URL}${apiEndpoint}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const users = await response.json();

                    // 构建用户表格HTML
                    let usersHtml = '';
                    users.forEach(user => {
                        usersHtml += `
                            <tr class="border-b border-gray-200">
                                <td class="py-3 px-4">${user.id}</td>
                                <td class="py-3 px-4">${user.username}</td>
                                <td class="py-3 px-4">${user.email}</td>
                                <td class="py-3 px-4">${user.role}</td>
                                <td class="py-3 px-4">${user.code}</td>
                            </tr>
                        `;
                    });

                    contentHtml += `
                        <div class="overflow-x-auto rounded-lg border border-gray-200">
                            <table class="min-w-full bg-white">
                                <thead class="bg-gray-100">
                                    <tr>
                                        <th class="py-3 px-4 text-left font-semibold text-gray-700">ID</th>
                                        <th class="py-3 px-4 text-left font-semibold text-gray-700">用户名</th>
                                        <th class="py-3 px-4 text-left font-semibold text-gray-700">邮箱</th>
                                        <th class="py-3 px-4 text-left font-semibold text-gray-700">角色</th>
                                        <th class="py-3 px-4 text-left font-semibold text-gray-700">密码</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${usersHtml}
                                </tbody>
                            </table>
                        </div>
                        <div class="mt-6">
                            <button class="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg flex items-center">
                                <i class="fas fa-user-plus mr-2"></i>添加新用户
                            </button>
                        </div>
                    `;

                    dynamicContentDiv.innerHTML = contentHtml;
                } catch (error) {
                    console.error(`Error fetching ${moduleName} data:`, error);
                    dynamicContentDiv.innerHTML = `<h2 class="text-2xl font-bold text-red-600">加载 ${moduleName} 失败</h2><p class="text-red-500">无法获取用户数据，请稍后再试。</p>`;
                    showToast(`加载 ${moduleName} 失败！`, 'error');
                }
                break;
            case '系统设置':
                contentHtml += `
                    <p class="text-gray-700">这里是系统设置和配置区域。</p>
                    <div class="mt-6 p-4 border rounded-lg bg-gray-50">
                        <h3 class="font-semibold text-lg mb-2">通用设置</h3>

                        <p class="text-gray-600 mt-2">系统名称: ${data.system_name}</p>
                        <p class="text-gray-600">版本: ${data.version}</p>
                        <p class="text-gray-600">联系邮箱: ${data.contact_email}</p>
                    </div>
                `;
                dynamicContentDiv.innerHTML = contentHtml;
                break;
            default:
                dynamicContentDiv.innerHTML = `<h2 class="text-2xl font-bold text-gray-800">模块加载失败</h2><p class="text-gray-700">请选择左侧导航菜单。</p>`;
        }
    } catch (error) {
        console.error(`Error fetching ${moduleName} data:`, error);
        dynamicContentDiv.innerHTML = `<h2 class="text-2xl font-bold text-red-600">加载 ${moduleName} 失败</h2><p class="text-red-500">无法获取数据，请稍后再试。</p>`;
        showToast(`加载 ${moduleName} 失败！`, 'error');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initial load for University Management
    basic_page = 1; // Ensure initial load uses its specific page counter
    fetchAndRenderModule('系统概览', '/stats'); // 改为加载系统概览

    const overviewNavItem = document.querySelector('.nav-item[data-module="系统概览"]');
    if (overviewNavItem) {
        overviewNavItem.classList.add('active');
    }

    // Sidebar navigation logic
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');

            const moduleName = this.getAttribute('data-module');
            // Reset page counters when switching modules
            if (moduleName === '系统概览') {
                basic_page = 1;
            }
            else if (moduleName === '高校管理') {
                universityCurrentPage = 1;
            } else if (moduleName === '专业管理') {
                majorCurrentPage = 1;
            }
            // For other modules, no specific page counter is managed currently, so no reset needed here.

            switch (moduleName) {
                case '系统概览':
                    fetchAndRenderModule('系统概览', '/stats');
                    break;
                case '高校管理':
                    renderUniversityManagementContent();
                    break;
                case '用户管理':
                    fetchAndRenderModule('用户管理', '/users');
                    break;
                case '系统设置':
                    fetchAndRenderModule('系统设置', '/settings');
                    break;
                default:
                    document.getElementById('dynamicContent').innerHTML = `<h2 class="text-2xl font-bold text-gray-800">模块加载失败</h2><p class="text-gray-700">请选择左侧导航菜单。</p>`;
            }

        });

    });

    // 添加用户管理模态框关闭监听
    document.getElementById('closeAddUserModal').addEventListener('click', () => closeModal('addUserModal'));
    document.getElementById('closeEditUserModal').addEventListener('click', () => closeModal('editUserModal'));

    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        const addUserModal = document.getElementById('addUserModal');
        const editUserModal = document.getElementById('editUserModal');

        if (event.target === addUserModal) closeModal('addUserModal');
        if (event.target === editUserModal) closeModal('editUserModal');
    });
});



// 渲染用户管理内容
async function renderUserManagementContent() {
    const dynamicContentDiv = document.getElementById('dynamicContent');
     const userManagementHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">用户管理</h2>
            <div class="flex space-x-4">
                <button id="addUserBtn" class="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg flex items-center operation-btn">
                    <i class="fas fa-user-plus mr-2"></i>添加用户
                </button>
                <button class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg flex items-center operation-btn" id="refreshUsersBtn">
                    <i class="fas fa-sync-alt mr-2"></i>
                </button>
            </div>
        </div>

        <div class="mb-6 flex items-center">
            <div class="relative w-64">
                <input type="text" id="searchUserInput" placeholder="搜索用户名或邮箱..." class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
            </div>
        </div>

        <div class="overflow-x-auto rounded-lg border border-gray-200">
            <table class="min-w-full bg-white" id="userTable">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="py-3 px-4 text-left font-semibold text-gray-700">ID</th>
                        <th class="py-3 px-4 text-left font-semibold text-gray-700">用户名</th>
                        <th class="py-3 px-4 text-left font-semibold text-gray-700">邮箱</th>
                        <th class="py-3 px-4 text-left font-semibold text-gray-700">角色</th>
                        <th class="py-3 px-4 text-left font-semibold text-gray-700">操作</th>
                    </tr>
                </thead>
                <tbody>
                    <!-- 用户数据将在这里动态加载 -->
                </tbody>
            </table>
        </div>

        
    `;
     dynamicContentDiv.innerHTML = userManagementHTML;

    // 绑定事件监听器
    attachUserManagementListeners();
    // 加载用户数据
    loadUsers();
}

// 绑定用户管理事件监听器
function attachUserManagementListeners() {
    document.getElementById('addUserBtn').addEventListener('click', () => {
        document.getElementById('addUserForm').reset();
        openModal('addUserModal');
    });

    document.getElementById('refreshUsersBtn').addEventListener('click', loadUsers);

    // 搜索功能
    document.getElementById('searchUserInput').addEventListener('input', () => {
        userCurrentPage = 1;
        loadUsers();
    });

    // 添加用户表单提交
    document.getElementById('addUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await addUser();
    });

    // 编辑用户表单提交
    document.getElementById('editUserForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateUser();
    });
}

// 加载用户数据
async function loadUsers() {
    const tableBody = document.querySelector('#userTable tbody');
    const searchQuery = document.getElementById('searchUserInput').value;

    try {
        const response = await fetch(`${API_BASE_URL}/users?search=${encodeURIComponent(searchQuery)}`);
        const users = await response.json();

        tableBody.innerHTML = '';

        if (users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="py-4 text-center text-gray-500">
                        没有找到相关用户
                    </td>
                </tr>
            `;
        } else {
            users.forEach(user => {
                const row = document.createElement('tr');
                row.className = 'border-b border-gray-200';
                row.innerHTML = `
                    <td class="py-3 px-4">${user.id}</td>
                    <td class="py-3 px-4">${user.username}</td>
                    <td class="py-3 px-4">${user.email}</td>
                    <td class="py-3 px-4">${user.role}</td>
                    <td class="py-3 px-4">
                        <button class="edit-user-btn mr-2 text-blue-500 hover:text-blue-700" data-id="${user.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-user-btn text-red-500 hover:text-red-700" data-id="${user.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            // 绑定编辑和删除按钮事件
            document.querySelectorAll('.edit-user-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const userId = btn.getAttribute('data-id');
                    openEditUserModal(userId);
                });
            });

            document.querySelectorAll('.delete-user-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const userId = btn.getAttribute('data-id');
                    deleteUser(userId);
                });
            });
        }
    } catch (error) {
        showToast('加载用户数据失败: ' + error.message, 'error');
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="py-4 text-center text-red-500">
                    加载用户数据失败
                </td>
            </tr>
        `;
    }
}

// 添加新用户
async function addUser() {
    const userId = document.getElementById('newUserId').value;
    const username = document.getElementById('newUserName').value;
    const email = document.getElementById('newUserEmail').value;
    const role = document.getElementById('newUserRole').value;
    const password = document.getElementById('newUserPassword').value;

    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: userId,
                username: username,
                email: email,
                role: role,
                password: password
            })
        });

        const result = await response.json();

        if (response.ok) {
            showToast('用户添加成功');
            closeModal('addUserModal');
            loadUsers();
        } else {

        }
    } catch (error) {

    }
}

// 打开编辑用户模态框
async function openEditUserModal(userId) {
    try {
        // 修改为获取单个用户的API调用
        const response = await fetch(`${API_BASE_URL}/users/${userId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const user = await response.json(); // 直接获取用户对象

        // 填充表单数据
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserIdField').value = user.id;
        document.getElementById('editUserName').value = user.username;
        document.getElementById('editUserEmail').value = user.email;
        document.getElementById('editUserRole').value = user.role;
        document.getElementById('editUserPassword').value = '';

        openModal('editUserModal');
    } catch (error) {
        console.error('加载用户信息失败:', error);
        showToast('加载用户信息失败: ' + error.message, 'error');
    }
}

// 更新用户信息
async function updateUser() {
    const userId = document.getElementById('editUserId').value;
    const username = document.getElementById('editUserName').value;
    const email = document.getElementById('editUserEmail').value;
    const role = document.getElementById('editUserRole').value;
    const password = document.getElementById('editUserPassword').value;

    try {
        const userData = {
            id: userId,
            username: username,
            email: email,
            role: role
        };

        if (password) {
            userData.password = password;
        }

        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const result = await response.json();

        if (response.ok) {
            showToast('用户信息更新成功');
            closeModal('editUserModal');
            loadUsers();
        } else {
            throw new Error(result.message || '更新用户信息失败');
        }
    } catch (error) {
        showToast('更新用户信息失败: ' + error.message, 'error');
    }
}

// 删除用户
async function deleteUser(userId) {
    if (!confirm('确定要删除该用户吗？此操作不可撤销。')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: userId })
        });

        const result = await response.json();

        if (response.ok) {
            showToast('用户删除成功');
            loadUsers();
        } else {
            throw new Error(result.message || '删除用户失败');
        }
    } catch (error) {
        showToast('删除用户失败: ' + error.message, 'error');
    }
}


