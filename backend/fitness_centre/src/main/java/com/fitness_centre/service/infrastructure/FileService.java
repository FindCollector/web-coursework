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
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
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

    private final static Set<String> ALLOW_FORMAT = Set.of("png","jpeg","jpg");

    public String uploadFileToTemp(MultipartFile file,Long useId){
        if(Objects.isNull(file) || file.isEmpty()){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"File is invalid");
        }
        //todo 删除已经被删除的coach的照片
        // (2) 读取图片数据
        BufferedImage image;
        try {
            image = ImageIO.read(file.getInputStream());
        } catch (IOException e) {
            throw new SystemException(ErrorCode.SYSTEM_ERROR.getCode(), "Failed to read image file.", e);
        }

        if (Objects.isNull(image)) {
            // 如果 read(...) 返回 null，说明可能不是有效的图片格式
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(), "Invalid image format.");
        }


        //生成文件名
        String originFilename = file.getOriginalFilename();
        String extension = FilenameUtils.getExtension(originFilename).toLowerCase(Locale.ROOT);
        if(!ALLOW_FORMAT.contains(extension)){
            throw new BusinessException(ErrorCode.INVALID_PARAMETER.getCode(),"File format error");
        }
        if(extension.equals("jpeg")){
            extension = "jpg";
        }

        String newFileName = useId + "." + extension;
        File destFile = new File(tempPath,newFileName);
        try{
            ImageIO.write(image,extension,destFile);
        } catch (IOException e) {
            System.out.println(e.getMessage());
            throw new SystemException(ErrorCode.FILE_SERVICE_ERROR);
        }
        return  "/temp/" + newFileName;
    }


    public void deleteFileByUseId(Long userId){
        String[] possibleExtensions = {".jpg",".jpeg","png"};
        for(String ext : possibleExtensions){
            String filePath = formalPath + "/" + userId + ext;
            File file = new File(filePath);
            if(file.exists()){
                boolean delete = file.delete();
                if(!delete){
                    throw new SystemException(ErrorCode.FILE_SERVICE_ERROR.getCode(),"Unable to delete file");
                }
            }
        }
    }
}