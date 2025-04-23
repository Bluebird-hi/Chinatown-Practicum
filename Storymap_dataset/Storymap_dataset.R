library(sf)
library(tidyverse)
library(ggplot2)
library(glue)
library(ppcor)
source("https://raw.githubusercontent.com/urbanSpatial/Public-Policy-Analytics-Landing/master/functions.r")

studyarea_4326 <- st_read("E:/Spring/Practicum/DataAnalysis/Chinatown/Dataset/studyarea/StudyArea.shp") %>%
  st_transform('EPSG:4326')
property_S1_4326 <- st_read("E:/Spring/Practicum/DataAnalysis/Chinatown/Storymap_dataset/property_S1_fe.geojson") %>%
  st_transform('EPSG:4326')
property_S1_predict <- st_read("E:/Spring/Practicum/DataAnalysis/Chinatown/Dataset/property_S1_predicted.geojson") %>%
  st_transform('EPSG:2272')


# Save as GeoJSON format but with .json extension
st_write(studyarea_4326, "E:/Spring/Practicum/DataAnalysis/Chinatown/Storymap_dataset/studyarea.json", driver = "GeoJSON")
st_write(property_CT_4326, "E:/Spring/Practicum/DataAnalysis/Chinatown/Storymap_dataset/property_S1.json", driver = "GeoJSON")

# Plot Scenario1 Predictions
property_S1 <- st_transform(property_S1_4326, 2272)
studyarea <- st_transform(studyarea_4326, 2272)
palette5 <- colorRampPalette(c("#1a9988", "#eb5600"))(5)
discontinuity <- st_read("E:/Spring/Practicum/DataAnalysis/Chinatown/Dataset/studyarea-sub/discontinuity.shp") %>%
  st_transform('EPSG:2272')
Chinatown_Stitch <- st_read("E:/Spring/Practicum/DataAnalysis/Chinatown/Dataset/Chinatown_Stitch/Chinatown_Stitch.shp") %>%
  st_transform('EPSG:2272')
studyarea_north <- st_read("E:/Spring/Practicum/DataAnalysis/Chinatown/Dataset/studyarea-sub/studyarea_north.shp") %>%
  st_transform('EPSG:2272')
studyarea_south <- st_read("E:/Spring/Practicum/DataAnalysis/Chinatown/Dataset/studyarea-sub/studyarea_south.shp") %>%
  st_transform('EPSG:2272')
################################################################
# Scenario 0: no built
S0_map <- ggplot() +
  geom_sf(data = studyarea, fill = "transparent", color = "grey60", linewidth = 1.2, linetype = "dashed") +
  geom_sf(data = discontinuity, fill = "black", color = "transparent") +
  geom_sf(data = Chinatown_Stitch %>% filter(FID_ == 500391), fill = "grey", color = "grey", linewidth = 1) +
  geom_sf(data = Chinatown_Stitch %>% filter(FID_ != 500391), fill = "white", color = "grey", linewidth = 1) +
  geom_sf(data = property_S1 %>% filter(!adj_sale_price > 100), colour = "grey",
          show.legend = "point", size = .8) +
  geom_sf(data = property_S1 %>% filter(adj_sale_price > 100), aes(colour = q5(adj_sale_price)),
          show.legend = "point", size = .8) +
  scale_colour_manual(values = palette5,
                      labels = qBr(property_S1 %>% filter (adj_sale_price > 100), "adj_sale_price"),
                      name="Quintile Breaks") +
  guides(color = guide_legend(override.aes = list(size = 3))) + 
  labs(title="Predicted Sale Price - Scenario 0",
       subtitle = "No Built") +
  theme_void() +
  theme(plot.title = element_text(size = 18, face = "bold"),
        plot.subtitle = element_text(size = 12))
ggsave(filename = "E:/Spring/Practicum/DataAnalysis/Chinatown/Storymap_dataset/Outputs/S0_map.png", plot = S0_map, height = 5, width = 8.5, units = "in", dpi = 300)
######################################################################
# Scenario 0: discontinuity
discontinuity_S1 <- property_S1 %>% filter (adj_sale_price > 100)
discontinuity_S1 <- rbind(
  discontinuity_S1 %>% st_intersection(studyarea_north["geometry"]) %>%
    mutate(I676_NS = "north"),
  discontinuity_S1 %>% st_intersection(studyarea_south["geometry"]) %>%
    mutate(I676_NS = "south")
)
discontinuity_S1 <- discontinuity_S1 %>%
  st_drop_geometry() %>%
  mutate(distance_to_I676m = distance_to_I676 * 0.3048,
         distance_to_highway = case_when(
           I676_NS == "north" ~ distance_to_I676m,
           I676_NS == "south" ~ -distance_to_I676m
         ))
discontinuity_S1 <- discontinuity_S1 %>% 
  filter(abs(distance_to_highway) <= 500)
coef_north_S0 <- round(
  summary(
    lm(log(adj_sale_price+1) ~ distance_to_highway,
       data = discontinuity_S1,
       I676_NS == "north") # 609 properties
)$coefficients[2,1], 3) # p = 0.636
coef_south_S0 <- round(
  summary(
    lm(log(adj_sale_price+1) ~ abs(distance_to_highway), # need to use absolute value cause distance values are negative
       data = discontinuity_S1,
       I676_NS == "south") # 811 properties
)$coefficients[2,1], 3) # *** p < 0.001

discontinuity_plot_S0 <- ggplot(data = discontinuity_S1) +
  # geom_smooth(aes(x = distance_to_highway, y = log(adj_sale_price+1), group = I676_NS), 
  #             color = "grey50",method = "lm", se = FALSE, size = .8, linetype = "dashed") +
  geom_point(aes(x = distance_to_highway, y = log(adj_sale_price+1), color = I676_NS), size = 0.3) +
  geom_smooth(aes(x = distance_to_highway, y = log(adj_sale_price+1), color = I676_NS), method = "lm", se = FALSE, size = 1.2) +
  geom_vline(xintercept = 0, color = "black", size = 2) +
  
  # custom colors
  scale_colour_manual(values = c("north" = "#eb5600", "south" = "#1a9988")) +
  
  theme_minimal() +
  theme(legend.position = "None",
        plot.title = element_text(size = 14, face = "bold"),
        plot.subtitle = ggtext::element_markdown(size = 12),
        plot.caption = element_text(hjust = 0)) +
  labs(title = 'Highway Effect - Scenario 0', 
       subtitle = glue("<span style='color:#1a9988;'>South Side</span> vs. <span style='color:#eb5600;'>North Side</span>"),
       x = "Distance to the Highyway (m)",
       y = "Log-transformed Sale Price") +
  
  # add annotations
  geom_label(aes(x = 0, y = 11, label = "I-676"),
             fill = "black", color = "white", fontface = "bold", size = 5) +
  geom_text(aes(label = coef_north_S0,
                x = 250,
                y = 11.825),
            color = "#eb5600",
            show.legend = F) +
  geom_text(aes(label = coef_south_S0,
                x = -250,
                y = 11.825),
            color = "#1a9988",
            show.legend = F)
ggsave(filename = "E:/Spring/Practicum/DataAnalysis/Chinatown/Storymap_dataset/Outputs/discontinuity_plot_S0.png", plot = discontinuity_plot_S0, height = 5, width = 8.5, units = "in", dpi = 300)
#################################################################
# Scenario 1: Stitch built
S1_map <- ggplot() +
  geom_sf(data = studyarea, fill = "transparent", color = "grey60", linewidth = 1.2, linetype = "dashed") +
  geom_sf(data = discontinuity, fill = "black", color = "transparent") +
  geom_sf(data = Chinatown_Stitch %>% filter(FID_ == 500391), fill = "grey", color = "grey", linewidth = 1) +
  geom_sf(data = Chinatown_Stitch %>% filter(FID_ != 500391), fill = "white", color = "grey", linewidth = 1) +
  geom_sf(data = property_S1_predict, aes(colour = q5(predicted_price)),
          show.legend = "point", size = .8) +
  scale_colour_manual(values = palette5,
                      labels = qBr(property_S1 %>% filter (adj_sale_price > 100), "adj_sale_price"),
                      name="Quintile Breaks") +
  guides(color = guide_legend(override.aes = list(size = 3))) + 
  labs(title="Predicted Sale Price - Scenario 1",
       subtitle = "The Chinatown Stich Built") +
  theme_void() +
  theme(plot.title = element_text(size = 18, face = "bold"),
        plot.subtitle = element_text(size = 12))
ggsave(filename = "E:/Spring/Practicum/DataAnalysis/Chinatown/Storymap_dataset/Outputs/S1_map.png", plot = S1_map, height = 5, width = 8.5, units = "in", dpi = 300)
####################################
# Scenario 1: distance to I-676
coef_north_S1 <- round(
  summary(
    lm(log(predicted_price+1) ~ distance_to_highway,
       data = discontinuity_S1,
                I676_NS == "north")) # 609 properties
  )$coefficients[2,1], 3) # p = 0.636
coef_south_S1 <- round(
  summary(
    lm(log(predicted_price+1) ~ abs(distance_to_highway), # need to use absolute value cause distance values are negative
       data = discontinuity_S1,
                I676_NS == "south")) # 811 properties
  )$coefficients[2,1], 3) # *** p < 0.001

discontinuity_plot_S1 <- ggplot(data = discontinuity_S1) +
  geom_smooth(aes(x = distance_to_highway, y = log(adj_sale_price+1), group = I676_NS), 
              color = "grey50",method = "lm", se = FALSE, size = .8, linetype = "dashed") +
  geom_point(aes(x = distance_to_highway, y = log(predicted_price+1), color = I676_NS), size = 0.3) +
  geom_smooth(aes(x = distance_to_highway, y = log(predicted_price+1), color = I676_NS), method = "lm", se = FALSE, size = 1.2) +
  geom_vline(xintercept = 0, color = "black", size = 2) +
  
  # custom colors
  scale_colour_manual(values = c("north" = "#eb5600", "south" = "#1a9988")) +
  
  theme_minimal() +
  theme(legend.position = "None",
        plot.title = element_text(size = 14, face = "bold"),
        plot.subtitle = ggtext::element_markdown(size = 12),
        plot.caption = element_text(hjust = 0)) +
  labs(title = 'Highway Effect - Scenario 1', 
       subtitle = glue("<span style='color:#1a9988;'>South Side</span> vs. <span style='color:#eb5600;'>North Side</span>"),
       x = "Distance to the Highyway (m)",
       y = "Log-transformed Sale Price") +
  
  # add annotations
  geom_label(aes(x = 0, y = 11.5, label = "I-676"),
             fill = "black", color = "white", fontface = "bold", size = 5) +
  geom_text(aes(label = coef_north_S1,
                x = 250,
                y = 11.825),
            color = "#eb5600",
            show.legend = F) +
  geom_text(aes(label = coef_south_S1,
                x = -250,
                y = 11.825),
            color = "#1a9988",
            show.legend = F)
ggsave(filename = "E:/Spring/Practicum/DataAnalysis/Chinatown/Storymap_dataset/Outputs/discontinuity_plot_S1.png", plot = discontinuity_plot_S1, height = 5, width = 8.5, units = "in", dpi = 300)
###############################################################################
# Comparison: density
S0_S1_density <- ggplot() +
  geom_density(data = property_S1 %>% filter(adj_sale_price > 100), aes(x = adj_sale_price), fill = "#eb5600", alpha = 0.6, color = "transparent") +
  geom_density(data = property_S1_predict, aes(x = predicted_price), fill = "#1a9988", alpha = 0.6, color = "transparent") +
  geom_vline(data = property_S1 %>% filter(adj_sale_price > 100), aes(xintercept = mean(adj_sale_price, na.rm = TRUE)), linetype = "dashed", color = "#eb5600") +
  geom_vline(data = property_S1_predict, aes(xintercept = mean(predicted_price, na.rm = TRUE)), linetype = "dashed", color = "#1a9988") +
  scale_x_log10(labels = scales::dollar) +
  labs(
    x = "Price",
    y = "Density",
    title = glue("<span style='color:#eb5600;'>Scenario 0 </span>vs. <span style='color:#1a9988;'>Scenario 1</span>")
  ) +
  theme_minimal() +
  theme(
    plot.title = ggtext::element_markdown(size = 16, face = "bold"),
    legend.position = "none"
  )
ggsave(filename = "E:/Spring/Practicum/DataAnalysis/Chinatown/Storymap_dataset/Outputs/S0_S1_density.png", plot = S0_S1_density, height = 5, width = 8.5, units = "in", dpi = 300)
