package org.example.biblioteca.book;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface BookRepository extends JpaRepository<Book, Long>, JpaSpecificationExecutor<Book> {
    boolean existsByIsbnIgnoreCase(String isbn);

    boolean existsByIsbnIgnoreCaseAndIdNot(String isbn, Long id);
}
