package com.tunisietelecom.gestionstock.utils;

import java.text.NumberFormat;
import java.util.Locale;

/**
 * Utilitaires de formatage partagés par la couche service.
 *
 * Centraliser ici garantit que les messages de notification affichent
 * les nombres avec séparateur de milliers (ex: 800 000 au lieu de 800000),
 * de façon cohérente avec le frontend (Intl.NumberFormat fr-FR).
 */
public final class FormatUtils {

    // French locale: space as thousands separator, comma as decimal separator.
    private static final NumberFormat FR_NUMBER = NumberFormat.getIntegerInstance(Locale.FRENCH);

    private FormatUtils() {
        // Utility class — not instantiable.
    }

    /**
     * Formate un entier avec séparateur de milliers français.
     * Ex: 800000 → "800 000", 12345 → "12 345"
     *
     * @param value la quantité à formater
     * @return la quantité formatée sous forme de chaîne
     */
    public static String fmtQty(int value) {
        return FR_NUMBER.format(value);
    }
}
