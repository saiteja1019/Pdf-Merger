let uploadedFiles = [];
let uploadedFilenames = [];

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('files');
const fileList = document.getElementById('file-list');
const mergeBtn = document.getElementById('merge-btn');

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    const formData = new FormData();
    
    for (let file of files) {
        if (file.type === 'application/pdf') {
            uploadedFiles.push(file);
            formData.append('files', file);
        }
    }
    
    if (uploadedFiles.length > 0) {
        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            uploadedFilenames = uploadedFilenames.concat(data.files);
            updateFileList();
            if (uploadedFilenames.length > 1) {
                mergeBtn.style.display = 'block';
            }
        });
    }
}

function updateFileList() {
    fileList.innerHTML = uploadedFiles.map((file, index) => 
        `<div class="file-item" draggable="true" data-index="${index}">
            <span class="drag-handle">⋮⋮</span>
            <span class="file-name">${file.name}</span>
            <button class="remove-btn" onclick="removeFile(${index})">&times;</button>
        </div>`
    ).join('');
    
    // Add drag and drop event listeners
    document.querySelectorAll('.file-item').forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
    });
}

let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.style.opacity = '0.5';
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(e) {
    e.preventDefault();
    if (this !== draggedElement) {
        const draggedIndex = parseInt(draggedElement.dataset.index);
        const targetIndex = parseInt(this.dataset.index);
        
        // Reorder arrays
        const draggedFile = uploadedFiles.splice(draggedIndex, 1)[0];
        const draggedFilename = uploadedFilenames.splice(draggedIndex, 1)[0];
        
        uploadedFiles.splice(targetIndex, 0, draggedFile);
        uploadedFilenames.splice(targetIndex, 0, draggedFilename);
        
        updateFileList();
    }
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    draggedElement = null;
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    uploadedFilenames.splice(index, 1);
    updateFileList();
    
    if (uploadedFiles.length < 2) {
        mergeBtn.style.display = 'none';
    }
}

function startOver() {
    uploadedFiles = [];
    uploadedFilenames = [];
    fileList.innerHTML = '';
    mergeBtn.style.display = 'none';
    mergeBtn.textContent = 'Merge PDFs';
    mergeBtn.disabled = false;
    document.getElementById('download-section').style.display = 'none';
    fileInput.value = '';
}

function mergePDFs() {
    mergeBtn.textContent = 'Merging...';
    mergeBtn.disabled = true;
    
    fetch('/merge', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: uploadedFilenames })
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('download-link').href = `/download/${data.merged_file}`;
        document.getElementById('download-section').style.display = 'block';
        mergeBtn.style.display = 'none';
    });
}