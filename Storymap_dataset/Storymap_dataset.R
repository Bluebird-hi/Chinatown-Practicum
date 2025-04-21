library(sf)

studyarea_4326 <- st_read("E:/Spring/Practicum/DataAnalysis/Chinatown/Dataset/studyarea/StudyArea.shp") %>%
  st_transform('EPSG:4326')
property_CT_4326 <- st_read("E:/Spring/Practicum/DataAnalysis/Chinatown/Dataset/property_CT_S2.geojson") %>%
  st_transform('EPSG:4326')


st_write(studyarea_4326, "E:/Spring/Practicum/DataAnalysis/Chinatown/Storymap_dataset/studyarea.geojson")
st_write(property_CT_4326, "E:/Spring/Practicum/DataAnalysis/Chinatown/Storymap_dataset/property_CT.geojson")