package com.fitness_centre.service.infrastructure;

import com.fitness_centre.constant.ErrorCode;
import com.fitness_centre.exception.BusinessException;
import com.fitness_centre.exception.SystemException;
import lombok.Data;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.Buffer;
import java.util.Objects;
import java.util.UUID;

/**
 * @author
 * @Classname FileService
 * @Description TODO
 * @date 01/04/2025
 */
@Service
@Data
public class FileService {
    @Value("${upload.temp-path}")
    private String tempPath;

    @Value("${upload.formal-path}")
    private String formalPath;

    public String uploadFileToTemp(MultipartFile file){
        if(Objects.isNull(file) || file.isEmpty()){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"File is invalid");
        }
        //todo 删除已经被删除的coach的照片

        //后缀
        String originFilename = file.getOriginalFilename();
        String extension = FilenameUtils.getExtension(originFilename);

        //生成随机的文件名
        String newFileName = UUID.randomUUID().toString() + "." + extension;

        File destFile = new File(tempPath,newFileName);
        try{
            file.transferTo(destFile);
        } catch (IOException e) {
            System.out.println(e.getMessage());
            throw new SystemException(ErrorCode.FILE_SERVICE_ERROR);
        }
        return  "/temp/" + newFileName;
    }

    public String confirmFile(String tempFileUrl,Long userId){
        if(Objects.isNull(tempFileUrl) || !tempFileUrl.startsWith("/temp/")){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"File  path is invalid");
        }
        //提取文件名
        String fileName = tempFileUrl.substring("/temp/".length());
        //用userId做前缀方便删除
        File tempFile = new File(tempPath,fileName);
        if(!tempFile.exists()){
            throw new BusinessException(ErrorCode.FILE_SERVICE_ERROR.getCode(),"Temp file is not exists");
        }

        File formalDir = new File(formalPath);
        //统一成jpg格式
        String newFileName = userId.toString() + ".jpg";
        File newFile = new File(formalDir,newFileName);
        try{
            BufferedImage image = ImageIO.read(tempFile);
            if(Objects.isNull(image)){
                throw new BusinessException(ErrorCode.FILE_SERVICE_ERROR.getCode(),"Not an image or corrupted file");
            }

            ImageIO.write(image,"jpg",newFile);

            tempFile.delete();
        } catch (IOException e) {
            throw new SystemException(ErrorCode.FILE_SERVICE_ERROR.getCode(), "File setting failed");
        }

        return "/formal/" + fileName;
    }

    public void deleteFile(String fileUrl){
        if(Objects.isNull(fileUrl)){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"File  path is invalid");
        }
        if(fileUrl.startsWith("/temp/")){
            String fileName = fileUrl.substring("/temp/".length());
            File file = new File(tempPath,fileName);
            if(file.exists()){
                file.delete();
            }
        }
        else if(fileUrl.startsWith("/formal/")){
            String fileName = fileUrl.substring("/formal/".length());
            File file = new File(formalPath,fileName);
            if(file.exists()){
                file.delete();
            }
        }
        else {
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"File  path is invalid");
        }
    }

    public void deleteFileByUseId(Long userId){
        String filePath = formalPath + "/" + userId.toString() + ".jpg";
        File file = new File(filePath);
        if(file.exists()){
            file.delete();
        }
    }
}