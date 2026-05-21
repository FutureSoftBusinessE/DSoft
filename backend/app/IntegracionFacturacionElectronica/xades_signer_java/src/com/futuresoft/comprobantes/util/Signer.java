package com.futuresoft.comprobantes.util;

import es.mityc.firmaJava.libreria.xades.DataToSign;
import es.mityc.firmaJava.libreria.xades.EnumFormatoFirma;
import es.mityc.firmaJava.libreria.xades.XAdESSchemas;
import es.mityc.javasign.xml.refs.InternObjectToSign;
import es.mityc.javasign.xml.refs.ObjectToSign;
import org.w3c.dom.Document;

/**
 *
 * @author Rolando
 */
public class Signer extends GenericXMLSignature {

    private String rutaDocumentoAFirmar;
    private String rutaDocumentoFirmado;
//    private String PASSWORD;

    public Signer(String rutaDocumentoAFirmar, String rutaDocumentoFirmado, String rutaFirma, String claveFirma) {
        this.rutaDocumentoAFirmar = rutaDocumentoAFirmar;
        this.rutaDocumentoFirmado = rutaDocumentoFirmado;
        PKCS12_RESOURCE = rutaFirma;
        PKCS12_PASSWORD = claveFirma;
    }

    @Override
    protected DataToSign createDataToSign() {
        DataToSign dataToSign = new DataToSign();
        try {
            dataToSign.setXadesFormat(EnumFormatoFirma.XAdES_BES);
            dataToSign.setEsquema(XAdESSchemas.XAdES_132);
            dataToSign.setXMLEncoding("UTF-8");
            dataToSign.setEnveloped(true);
            dataToSign.addObject(new ObjectToSign(new InternObjectToSign("comprobante"), "contenido comprobante", null, "text/xml", null));
            Document docToSign = getDocument(getRutaDocumentoAFirmar());
            dataToSign.setDocument(docToSign);
        } catch (Exception ex) {
            dataToSign = null;
            System.out.println(ex.getMessage());
        } finally {
            return dataToSign;
        }
    }

    @Override
    protected String getSignatureFileName() {
        return rutaDocumentoFirmado;
    }

    public void firmar() throws Exception {
        execute();
    }

    /**
     * @return the rutaDocumentoAFirmar
     */
    public String getRutaDocumentoAFirmar() {
        return rutaDocumentoAFirmar;
    }

    /**
     * @param rutaDocumentoAFirmar the rutaDocumentoAFirmar to set
     */
    public void setRutaDocumentoAFirmar(String rutaDocumentoAFirmar) {
        this.rutaDocumentoAFirmar = rutaDocumentoAFirmar;
    }

    /**
     * @return the rutaDocumentoFirmado
     */
    public String getRutaDocumentoFirmado() {
        return rutaDocumentoFirmado;
    }

    /**
     * @param rutaDocumentoFirmado the rutaDocumentoFirmado to set
     */
    public void setRutaDocumentoFirmado(String rutaDocumentoFirmado) {
        this.rutaDocumentoFirmado = rutaDocumentoFirmado;
    }

//    public static void main(String... args) {
//        Signer prueba = new Signer("C:\\tmp\\XMLOrigen\\1208201401099151520800110010011001361200000000011.xml", "C:\\tmp\\XMLFinal\\1208201401099151520800110010011001361200000000011.xml", "");
//        prueba.firmar();
//    }
}
