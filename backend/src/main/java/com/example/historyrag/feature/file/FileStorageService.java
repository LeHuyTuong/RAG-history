package com.example.historyrag.feature.file;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path fileStorageLocation;

    public FileStorageService(@Value("${app.upload.base-path:./uploads}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public String storeFile(MultipartFile file) {
        // Normalize file name
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());

        try {
            // Check if the file's name contains invalid characters
            if (originalFileName.contains("..")) {
                throw new RuntimeException("Sorry! Filename contains invalid path sequence " + originalFileName);
            }
            
            // Validate file extension (basic security check)
            String extension = "";
            int dotIndex = originalFileName.lastIndexOf('.');
            if(dotIndex > 0) {
                extension = originalFileName.substring(dotIndex);
            }
            
            String safeFileName = UUID.randomUUID().toString() + extension;

            // Copy file to the target location (Replacing existing file with the same name)
            Path targetLocation = this.fileStorageLocation.resolve(safeFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return "/uploads/" + safeFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFileName + ". Please try again!", ex);
        }
    }
}
