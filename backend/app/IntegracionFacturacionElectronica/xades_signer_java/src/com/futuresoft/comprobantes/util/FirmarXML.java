package com.futuresoft.comprobantes.util;

public class FirmarXML {
    public static void main(String[] args) {
        if (args.length < 4) {
            System.out.println("ERROR: Faltan parametros");
            System.out.println("Uso: java FirmarXML <xml_entrada> <xml_salida> <cert.p12> <password>");
            System.exit(1);
        }
        try {
            Signer signer = new Signer(args[0], args[1], args[2], args[3]);
            signer.firmar();
            System.out.println("OK: " + args[1]);
        } catch (Exception e) {
            System.err.println("ERROR: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}