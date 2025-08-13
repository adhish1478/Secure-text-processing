import { authService } from './authservice.js';


document.addEventListener('DOMContentLoaded', function() {
    // Check if user is authenticated
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        window.location.href = '/login';
        return;
    }
    
    // Set up dashboard functionality
    setupDashboard();
});

function setupDashboard() {
    // Set user's full name in navbar
    const fullName = localStorage.getItem('fullName');
    if (fullName) {
        document.getElementById('userFullName').textContent = fullName;
    }
    
    // Set up logout button
    document.getElementById('logoutButton').addEventListener('click', function() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('fullName');
        window.location.href = '/login';
    });
    
     // Set up search functionality
    const searchInput = document.getElementById('searchInput');
    
    // Debounced search on typing
    const debouncedSearch = debounce(handleSearch, 500);
    searchInput.addEventListener('keyup', debouncedSearch);
    
    // Immediate search on Enter key
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            debouncedSearch.cancel(); // Cancel any pending debounced search
            handleSearch();
        }
    });
    
    // Set up add paragraph modal
    const addParagraphButton = document.getElementById('addParagraphButton');
    const addParagraphModal = document.getElementById('addParagraphModal');
    const closeModal = document.getElementById('closeModal');
    const cancelParagraph = document.getElementById('cancelParagraph');
    
    // Show modal
    addParagraphButton.addEventListener('click', function() {
        addParagraphModal.classList.add('active');
    });

    // Hide modal (both close buttons)
    [closeModal, cancelParagraph].forEach(button => {
        button.addEventListener('click', function() {
            addParagraphModal.classList.remove('active');
        });
    });

    // Close modal when clicking outside
    addParagraphModal.addEventListener('click', function(e) {
        if (e.target === addParagraphModal) {
            addParagraphModal.classList.remove('active');
        }
    });


    addParagraphButton.addEventListener('click', function() {
        addParagraphModal.classList.remove('hidden');
    });
    
    closeModal.addEventListener('click', function() {
        addParagraphModal.classList.add('hidden');
    });
    
    cancelParagraph.addEventListener('click', function() {
        addParagraphModal.classList.add('hidden');
    });
    
    // Set up paragraph submission
    document.getElementById('submitParagraph').addEventListener('click', submitNewParagraph);
    
    console.log('Paragraph submitted, loading paragraphs'); 
    // Load initial paragraphs
    loadParagraphs();

}

function debounce(func, wait) {
    let timeout;
    function cancel() {
        clearTimeout(timeout);
    }
    function debounced() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    }
    debounced.cancel = cancel;
    return debounced;
}

async function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    
    if (searchTerm.length === 0) {
        // Show all paragraphs if search is empty
        document.getElementById('searchResultsContainer').classList.add('hidden');
        document.getElementById('paragraphsContainer').classList.remove('hidden');
        return;
    }
    
    try {
        // Updated API endpoint with word and page parameters
        const response = await authService.makeAuthenticatedRequest(
            `/api/paragraphs/search/?word=${encodeURIComponent(searchTerm)}&page=1`
        );
        
        if (response.ok) {
            const data = await response.json();
            displaySearchResults(searchTerm, data.results);
        } else {
            console.error('Search failed:', response.status);
        }
    } catch (error) {
        console.error('Search error:', error);
    }
}


function displaySearchResults(searchTerm, paragraphs) {
    const searchTermElement = document.getElementById('searchTerm');
    const searchResultsElement = document.getElementById('searchResults');
    
    searchTermElement.textContent = searchTerm;
    searchResultsElement.innerHTML = '';
    
    if (paragraphs.length === 0) {
        console.log('No results found for:', searchTerm);
        searchResultsElement.innerHTML = '<p>No results found</p>';
    } else {
        paragraphs.forEach(paragraph => {
            // Pass searchTerm to createParagraphCard for highlighting
            const paragraphElement = createParagraphCard(paragraph, searchTerm.toLowerCase());
            searchResultsElement.appendChild(paragraphElement);
        });
    }
    
    document.getElementById('paragraphsContainer').classList.add('hidden');
    document.getElementById('searchResultsContainer').classList.remove('hidden');
}

async function loadParagraphs() {
    try {
        const response = await authService.makeAuthenticatedRequest('/api/paragraphs/');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const paragraphs = await response.json();
        console.log('Received paragraphs:', paragraphs); // Debug log
        
        if (!Array.isArray(paragraphs)) {
            throw new Error('Expected array but got:', typeof paragraphs);
        }
        
        displayParagraphs(paragraphs);
    } catch (error) {
        console.error('Error loading paragraphs:', error);
        showParagraphError('Error loading paragraphs. Please try again later.');
    }
}

function displayParagraphs(paragraphs) {
    const container = document.getElementById('paragraphsContainer');
    container.innerHTML = '';
    
    if (!paragraphs || paragraphs.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No paragraphs yet, Try adding some!</p>
            </div>
        `;
    }
    // Sort paragraphs by created_at date (newest first)
    paragraphs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    paragraphs.forEach(paragraph => {
        const paragraphElement = createParagraphCard(paragraph);
        container.appendChild(paragraphElement);
    });
}

function createParagraphCard(paragraph, searchTerm = null) {
    const card = document.createElement('div');
    card.className = 'paragraph-card';
    
    let contentText = paragraph.content || 'No content available';
    
    // Highlight matching words if searchTerm exists
    if (searchTerm && paragraph.positions && paragraph.positions.length > 0) {
        const words = contentText.split(' ');
        let charCount = 0;
        
        // Rebuild content with highlighted words
        contentText = words.map(word => {
            const wordStart = charCount;
            const wordEnd = charCount + word.length;
            let shouldHighlight = false;
            
            // Check if any position falls within this word
            for (const pos of paragraph.positions) {
                if (pos >= wordStart && pos < wordEnd) {
                    shouldHighlight = true;
                    break;
                }
            }
            
            charCount += word.length + 1; // +1 for the space
            
            return shouldHighlight 
                ? `<span class="highlight">${word}</span>` 
                : word;
        }).join(' ');
    }
    
    const content = document.createElement('div');
    content.className = 'paragraph-content';
    content.innerHTML = contentText; // Use innerHTML to render spans
    
    // Date element
    const date = document.createElement('div');
    date.className = 'paragraph-date';
    date.textContent = paragraph.created_at 
        ? formatDate(paragraph.created_at)
        : 'No date';
    
    // Match count badge
    if (searchTerm && paragraph.match_count) {
        const matchBadge = document.createElement('div');
        matchBadge.className = 'match-badge';
        matchBadge.textContent = `${paragraph.match_count} match${paragraph.match_count !== 1 ? 'es' : ''}`;
        card.appendChild(matchBadge);
    }
    
    card.appendChild(content);
    card.appendChild(date);
    
    return card;
}

// Helper function to format date
function formatDate(isoString) {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function submitNewParagraph() {
    const textarea = document.getElementById('paragraphText');
    const errorElement = document.getElementById('paragraphError');
    const submitButton = document.getElementById('submitParagraph');
    const paragraphText = textarea.value.trim();
    
    if (paragraphText.length === 0) {
        errorElement.textContent = 'Please enter some text';
        return;
    }
    
    errorElement.textContent = '';
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    
    try {
        // Replace with your actual API endpoint
        const response = await authService.makeAuthenticatedRequest('/api/paragraphs/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: paragraphText
            })
        });
        
        if (response.ok) {
            // Clear textarea and close modal
            textarea.value = '';
            document.getElementById('addParagraphModal').classList.remove('active');
            document.getElementById('addParagraphModal').classList.add('hidden');
            
            // Reload paragraphs
            //loadParagraphs();

            // Count current paragraphs before polling
            const currentParagraphs = document.querySelectorAll('.paragraph-card').length;
            await pollForNewParagraph(currentParagraphs); // Start polling
        } else {
            const data = await response.json();
            errorElement.textContent = data.detail || 'Failed to submit paragraph';
        }
    } catch (error) {
        console.error('Error submitting paragraph:', error);
        errorElement.textContent = 'An error occurred. Please try again.';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Submit';
    }
}

// Polling function to check for new paragraphs
async function pollForNewParagraph(initialCount, retries = 5) {
    for (let i = 0; i < retries; i++) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2 seconds

        try {
            const response = await authService.makeAuthenticatedRequest('/api/paragraphs/');
            const paragraphs = await response.json();
            if (paragraphs.length > initialCount) {
                console.log('New paragraph detected. Reloading...');
                displayParagraphs(paragraphs);
                return;
            }
        } catch (err) {
            console.error('Polling failed', err);
        }
    }
    console.warn('Paragraph not detected after polling.');
}