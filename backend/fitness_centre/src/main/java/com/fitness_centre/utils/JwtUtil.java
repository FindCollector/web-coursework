package com.fitness_centre.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

/**
 * JWT tools
 */
public class JwtUtil {

    //Validity period
    public static final Long JWT_TTL = 24 * 60 * 60 *1000L;// one day
//    public  static final Long JWT_TTL = 10 * 1000L;
    //Setting the secret key plaintext
    public static final String JWT_KEY = "hjg2+6IvkaspMPC5ffNGyAssXiUt0rmZcj3VOKU6hro=";

    public static String getUUID(){
        String token = UUID.randomUUID().toString().replaceAll("-", "");
        return token;
    }

    /**
     * Generate JWT
     * @param subject data to be stored in the token (JSON format)
     * @return
     */
    public static String createJWT(String subject) {
        JwtBuilder builder = getJwtBuilder(subject, null, getUUID());// Set expiration time
        return builder.compact();
    }

    /**
     * Generate JWT
     * @param subject data to be stored in the token (JSON format)
     * @param ttlMillis token expiration time
     * @return
     */
    public static String createJWT(String subject, Long ttlMillis) {
        JwtBuilder builder = getJwtBuilder(subject, ttlMillis, getUUID());// Set expiration time
        return builder.compact();
    }

    private static JwtBuilder getJwtBuilder(String subject, Long ttlMillis, String uuid) {
        SignatureAlgorithm signatureAlgorithm = SignatureAlgorithm.HS256;
        SecretKey secretKey = generalKey();
        long nowMillis = System.currentTimeMillis();
        Date now = new Date(nowMillis);
        if(ttlMillis==null){
            ttlMillis=JwtUtil.JWT_TTL;
        }
        long expMillis = nowMillis + ttlMillis;
        Date expDate = new Date(expMillis);
        return Jwts.builder()
                .setId(uuid)              //Unique ID
                .setSubject(subject)   // Subject, can be JSON data
                .setIssuer("sg")     // Issuer
                .setIssuedAt(now)      // Issuance time
                .signWith(signatureAlgorithm, secretKey) //Use HS256 symmetric encryption algorithm for signing, the second parameter is the secret key
                .setExpiration(expDate);
    }

    /**
     * Create token
     * @param id
     * @param subject
     * @param ttlMillis
     * @return
     */
    public static String createJWT(String id, String subject, Long ttlMillis) {
        JwtBuilder builder = getJwtBuilder(subject, ttlMillis, id);// Set expiration time
        return builder.compact();
    }

    public static void main(String[] args) throws Exception {
//        String jwt = createJWT("2123");
        Claims claims = parseJWT("eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIyOTY2ZGE3NGYyZGM0ZDAxOGU1OWYwNjBkYmZkMjZhMSIsInN1YiI6IjIiLCJpc3MiOiJzZyIsImlhdCI6MTYzOTk2MjU1MCwiZXhwIjoxNjM5OTY2MTUwfQ.NluqZnyJ0gHz-2wBIari2r3XpPp06UMn4JS2sWHILs0");
        String subject = claims.getSubject();
        System.out.println(subject);
//        System.out.println(claims);
    }

    /**
     * Generate encrypted secret key
     * @return
     */
    public static SecretKey generalKey() {
        byte[] encodedKey = Base64.getDecoder().decode(JwtUtil.JWT_KEY);
        SecretKey key = new SecretKeySpec(encodedKey, 0, encodedKey.length, SignatureAlgorithm.HS256.getJcaName());
        return key;
    }

    /**
     * Parse JWT
     *
     * @param jwt
     * @return
     * @throws Exception
     */
    public static Claims parseJWT(String jwt) throws Exception {
        SecretKey secretKey = generalKey();
        return Jwts.parser()
                .setSigningKey(secretKey)
                .parseClaimsJws(jwt)
                .getBody();
    }


}