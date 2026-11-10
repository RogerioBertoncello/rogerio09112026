package org.example.biblioteca.book;

import jakarta.persistence.EntityNotFoundException;
import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.SQLException;
import java.util.List;
import java.util.Locale;

@Service
public class BookService {
    private final BookRepository repository;

    public BookService(BookRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Book> search(String title, String author, String isbn) {
        Specification<Book> specification = (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();
        if (hasText(title)) {
            String pattern = "%" + escapeLike(title.trim().toLowerCase(Locale.ROOT)) + "%";
            specification = specification.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("title")), pattern, '\\'));
        }
        if (hasText(author)) {
            String pattern = "%" + escapeLike(author.trim().toLowerCase(Locale.ROOT)) + "%";
            specification = specification.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("author")), pattern, '\\'));
        }
        if (hasText(isbn)) {
            String normalizedIsbn = isbn.trim().toLowerCase(Locale.ROOT);
            specification = specification.and((root, query, cb) ->
                    cb.equal(cb.lower(root.get("isbn")), normalizedIsbn));
        }
        return repository.findAll(specification);
    }

    @Transactional(readOnly = true)
    public Book findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Livro com ID " + id + " não encontrado."));
    }

    @Transactional
    public Book create(BookRequest request) {
        String isbn = request.isbn().trim();
        if (repository.existsByIsbnIgnoreCase(isbn)) {
            throw new DuplicateIsbnException(isbn);
        }
        Book book = new Book();
        applyRequest(book, request);
        return save(book, isbn);
    }

    @Transactional
    public Book update(Long id, BookRequest request) {
        Book book = findById(id);
        String isbn = request.isbn().trim();
        if (repository.existsByIsbnIgnoreCaseAndIdNot(isbn, id)) {
            throw new DuplicateIsbnException(isbn);
        }
        applyRequest(book, request);
        return save(book, isbn);
    }

    @Transactional
    public void delete(Long id) {
        Book book = findById(id);
        repository.delete(book);
    }

    private Book save(Book book, String isbn) {
        try {
            return repository.saveAndFlush(book);
        } catch (DataIntegrityViolationException exception) {
            if (isDuplicateIsbnViolation(exception)) {
                throw new DuplicateIsbnException(isbn);
            }
            throw exception;
        }
    }

    private boolean isDuplicateIsbnViolation(DataIntegrityViolationException exception) {
        for (Throwable cause = exception; cause != null; cause = cause.getCause()) {
            if (cause instanceof ConstraintViolationException violation
                    && "uk_books_isbn".equalsIgnoreCase(violation.getConstraintName())) {
                return true;
            }
            if (cause instanceof SQLException sqlException
                    && sqlException.getErrorCode() == 1062
                    && sqlException.getMessage().contains("uk_books_isbn")) {
                return true;
            }
        }
        return false;
    }

    private void applyRequest(Book book, BookRequest request) {
        book.setTitle(request.title().trim());
        book.setAuthor(request.author().trim());
        book.setIsbn(request.isbn().trim());
        book.setPublicationYear(request.publicationYear());
        book.setGenre(blankAsNull(request.genre()));
        book.setDescription(blankAsNull(request.description()));
    }

    private String blankAsNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
