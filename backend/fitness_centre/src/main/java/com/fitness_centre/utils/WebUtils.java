package com.fitness_centre.utils;

import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

public class WebUtils
{
    /**
     * Render string to client
     *
     * @param response rendering object
     * @param string string to be rendered
     * @return null
     */
    public static String renderString(HttpServletResponse response, String string) {
        try
        {
            response.setStatus(200);
            response.setContentType("application/json");
            response.setCharacterEncoding("utf-8");
            response.getWriter().print(string);
        }
        catch (IOException e)
        {
            e.printStackTrace();
        }
        return null;
    }
}