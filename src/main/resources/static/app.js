const bookForm = document.querySelector('#book-form');
const searchForm = document.querySelector('#search-form');
const bookList = document.querySelector('#book-list');
const notice = document.querySelector('#notice');
const count = document.querySelector('#book-count');
const summary = document.querySelector('#results-summary');
const saveButton = document.querySelector('#save-button');

function showNotice(message, type = 'success', details = []) {
    notice.replaceChildren();
    notice.className = `notice ${type}`;
    notice.setAttribute('role', type === 'error' ? 'alert' : 'status');
    notice.append(document.createTextNode(message));
    if (details.length) {
        const list = document.createElement('ul');
        details.forEach((detail) => {
            const item = document.createElement('li');
            item.textContent = detail;
            list.append(item);
        });
        notice.append(list);
    }
    if (type === 'error') {
        notice.focus();
        notice.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function clearNotice() {
    notice.className = 'notice hidden';
    notice.replaceChildren();
}

async function request(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: { Accept: 'application/json', ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
    });
    if (response.status === 204) return null;
    const body = await response.json().catch(() => null);
    if (!response.ok) {
        const error = new Error(body?.message || `A API retornou um erro ${response.status}.`);
        error.status = response.status;
        error.details = body?.details || [];
        throw error;
    }
    return body;
}

function displayError(error) {
    if (!error.status) {
        showNotice('Não foi possível conectar à API. Verifique se o servidor está disponível e tente novamente.', 'error');
        return;
    }
    showNotice(`Erro ${error.status}: ${error.message}`, 'error', error.details || []);
}

function renderBooks(books) {
    bookList.replaceChildren();
    count.textContent = `${books.length} ${books.length === 1 ? 'livro' : 'livros'}`;
    summary.textContent = books.length ? `${books.length} ${books.length === 1 ? 'resultado' : 'resultados'}` : '';

    if (!books.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        const title = document.createElement('strong');
        title.textContent = 'Nenhum livro por aqui ainda.';
        empty.append(title, document.createTextNode('Cadastre um livro ou ajuste sua busca para começar.'));
        bookList.append(empty);
        return;
    }

    books.forEach((book, index) => {
        const card = document.createElement('article');
        card.className = 'book-card';

        const cover = document.createElement('div');
        cover.className = 'book-cover';
        cover.style.backgroundColor = ['#758e77', '#c17d5b', '#75849a', '#b48b58', '#85749a'][index % 5];
        cover.textContent = book.title.trim().charAt(0).toUpperCase();

        const info = document.createElement('div');
        info.className = 'book-info';
        const title = document.createElement('h4');
        title.textContent = book.title;
        const author = document.createElement('p');
        author.textContent = `por ${book.author}`;
        const meta = document.createElement('div');
        meta.className = 'book-meta';
        [book.isbn, book.publicationYear, book.genre].filter(Boolean).forEach((value) => {
            const tag = document.createElement('span');
            tag.textContent = value;
            meta.append(tag);
        });
        info.append(title, author, meta);

        const actions = document.createElement('div');
        actions.className = 'card-actions';
        const edit = document.createElement('button');
        edit.className = 'icon-button';
        edit.type = 'button';
        edit.textContent = '✎';
        edit.title = 'Editar livro';
        edit.setAttribute('aria-label', `Editar ${book.title}`);
        edit.addEventListener('click', () => editBook(book));

        const remove = document.createElement('button');
        remove.className = 'icon-button delete';
        remove.type = 'button';
        remove.textContent = '⌫';
        remove.title = 'Excluir livro';
        remove.setAttribute('aria-label', `Excluir ${book.title}`);
        remove.addEventListener('click', () => deleteBook(book));
        actions.append(edit, remove);

        card.append(cover, info, actions);
        bookList.append(card);
    });
}

function searchParams() {
    const params = new URLSearchParams();
    new FormData(searchForm).forEach((value, key) => {
        if (key !== 'id' && value.trim()) params.set(key, value.trim());
    });
    return params.toString();
}

async function loadBooks() {
    clearNotice();
    try {
        const id = searchForm.elements.id.value.trim();
        if (id) {
            const book = await request(`/api/books/${encodeURIComponent(id)}`);
            renderBooks([book]);
            return;
        }
        const query = searchParams();
        const books = await request(`/api/books${query ? `?${query}` : ''}`);
        renderBooks(books);
    } catch (error) {
        displayError(error);
    }
}

function editBook(book) {
    bookForm.elements.id.value = book.id;
    bookForm.elements.title.value = book.title;
    bookForm.elements.author.value = book.author;
    bookForm.elements.isbn.value = book.isbn;
    bookForm.elements.publicationYear.value = book.publicationYear ?? '';
    bookForm.elements.genre.value = book.genre ?? '';
    bookForm.elements.description.value = book.description ?? '';
    document.querySelector('#form-heading').textContent = 'Atualizar livro';
    saveButton.firstChild.textContent = 'Salvar alterações ';
    document.querySelector('#cancel-edit').classList.remove('hidden');
    bookForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetForm() {
    bookForm.reset();
    bookForm.elements.id.value = '';
    document.querySelector('#form-heading').textContent = 'Adicionar ao catálogo';
    saveButton.firstChild.textContent = 'Adicionar livro ';
    document.querySelector('#cancel-edit').classList.add('hidden');
}

async function deleteBook(book) {
    if (!window.confirm(`Excluir "${book.title}" do catálogo?`)) return;
    clearNotice();
    try {
        await request(`/api/books/${encodeURIComponent(book.id)}`, { method: 'DELETE' });
        showNotice('Livro excluído do catálogo.');
        if (bookForm.elements.id.value === String(book.id)) resetForm();
        await loadBooks();
    } catch (error) {
        displayError(error);
    }
}

bookForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearNotice();
    const formData = new FormData(bookForm);
    const publicationYear = formData.get('publicationYear');
    const id = formData.get('id');
    const book = {
        title: formData.get('title').trim(),
        author: formData.get('author').trim(),
        isbn: formData.get('isbn').trim(),
        publicationYear: publicationYear ? Number(publicationYear) : null,
        genre: formData.get('genre').trim() || null,
        description: formData.get('description').trim() || null
    };
    try {
        await request(id ? `/api/books/${encodeURIComponent(id)}` : '/api/books', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(book)
        });
        showNotice(id ? 'Livro atualizado com sucesso.' : 'Livro adicionado ao catálogo.');
        resetForm();
        await loadBooks();
    } catch (error) {
        displayError(error);
    }
});

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    loadBooks();
});

document.querySelector('#clear-search').addEventListener('click', () => {
    searchForm.reset();
    loadBooks();
});

document.querySelector('#cancel-edit').addEventListener('click', resetForm);

loadBooks();
