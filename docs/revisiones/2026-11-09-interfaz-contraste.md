| Par                                                                | Hex                       | WCAG 2  | Umbral | Resultado | APCA Lc |
| ------------------------------------------------------------------ | ------------------------- | ------- | ------ | --------- | ------- |
| texto / fondo                                                      | `#1C1B22` sobre `#F5F4F8` | 15.60:1 | 4.5:1  | pasa      | 97.7    |
| texto / superficie                                                 | `#1C1B22` sobre `#FFFFFF` | 17.08:1 | 4.5:1  | pasa      | 104.0   |
| textoSecundario / superficie (fechas, etiquetas, 13-15pt)          | `#6B6878` sobre `#FFFFFF` | 5.42:1  | 4.5:1  | pasa      | 77.0    |
| textoSecundario / fondo (Ordenar por, intro, avisos, estado vacío) | `#6B6878` sobre `#F5F4F8` | 4.95:1  | 4.5:1  | pasa      | 70.8    |
| textoSecundario / primarioSuave (hora 11pt en burbuja propia)      | `#6B6878` sobre `#EDE7F6` | 4.48:1  | 4.5:1  | FALLA     | 64.3    |
| placeholder textoSecundario / superficie                           | `#6B6878` sobre `#FFFFFF` | 5.42:1  | 4.5:1  | pasa      | 77.0    |
| primario / superficie (precio, destacado, categoría)               | `#3B1E6E` sobre `#FFFFFF` | 13.15:1 | 4.5:1  | pasa      | 98.9    |
| primario / fondo (header: nombre usuario, +)                       | `#3B1E6E` sobre `#F5F4F8` | 12.01:1 | 4.5:1  | pasa      | 92.7    |
| primario / primarioSuave (botón secundario, iniciales, Stepper)    | `#3B1E6E` sobre `#EDE7F6` | 10.87:1 | 4.5:1  | pasa      | 86.2    |
| sobrePrimario / primario (botón primario, chip activo)             | `#FFFFFF` sobre `#3B1E6E` | 13.15:1 | 4.5:1  | pasa      | -102.3  |
| error / superficie (Cancelar compra, papelera)                     | `#C62828` sobre `#FFFFFF` | 5.62:1  | 4.5:1  | pasa      | 76.4    |
| error / fondo (aviso de Cargable)                                  | `#C62828` sobre `#F5F4F8` | 5.13:1  | 4.5:1  | pasa      | 70.2    |
| estrella / superficie (Estrellas, gráfico con significado)         | `#F5A623` sobre `#FFFFFF` | 2.03:1  | 3:1    | FALLA     | 39.1    |
| borde / superficie (borde de inputs y tipo de entrada)             | `#E3E1EA` sobre `#FFFFFF` | 1.29:1  | 3:1    | FALLA     | 14.6    |
| borde / fondo (borde de chip inactivo)                             | `#E3E1EA` sobre `#F5F4F8` | 1.18:1  | 3:1    | FALLA     | 8.3     |
| superficie / fondo (relleno del buscador vs pantalla)              | `#FFFFFF` sobre `#F5F4F8` | 1.09:1  | 3:1    | FALLA     | 0.0     |
| primario / primarioSuave (borde del tipo elegido)                  | `#3B1E6E` sobre `#EDE7F6` | 10.87:1 | 3:1    | pasa      | 86.2    |
| badge PENDIENTE (12pt bold)                                        | `#8A5A00` sobre `#FFF1D6` | 5.31:1  | 4.5:1  | pasa      | 71.8    |
| badge CONFIRMADA (12pt bold)                                       | `#1B6B32` sobre `#DFF3E4` | 5.66:1  | 4.5:1  | pasa      | 72.0    |
| badge UTILIZADA (12pt bold)                                        | `#555360` sobre `#ECEBF0` | 6.34:1  | 4.5:1  | pasa      | 74.6    |
| badge CANCELADA (12pt bold)                                        | `#A61B1B` sobre `#FBE2E2` | 6.11:1  | 4.5:1  | pasa      | 70.6    |
| badge REEMBOLSADA (12pt bold)                                      | `#1A4F99` sobre `#DFEAFB` | 6.60:1  | 4.5:1  | pasa      | 74.3    |
