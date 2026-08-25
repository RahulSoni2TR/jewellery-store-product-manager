package com.example.webapp.models;

import java.math.BigDecimal;
import org.springframework.web.multipart.MultipartFile;

public class ProductUpdateForm {
    private String productName;
    private String productOrderid;
    private BigDecimal productPrice;
    private String productRemarks;
    private String productImageUrl;
    private Integer categoryId;
    private Long subCategoryId;
    private BigDecimal productNet;
    private Integer pcs;
    private BigDecimal diaWeight;
    private BigDecimal diaRate;
    private BigDecimal diaOs;
    private BigDecimal diaOsRate;
    private BigDecimal gross;

    private BigDecimal vilandiCt;
    private BigDecimal diamondsCt;
    private BigDecimal diamondsCtRate;
    private BigDecimal beadsCt;
    private BigDecimal pearlsGm;
    private BigDecimal vilandiRate;
    private BigDecimal beadsRate;
    private BigDecimal openPearlsRate;
    private BigDecimal otherStonesCt;
    private BigDecimal otherOsRate;
    private String others;
    private String designNo;
    private Integer pcsEarrings;
    private BigDecimal diamondsCtEarrings;
    private BigDecimal diamondsCtEarringsRate;
    private BigDecimal diaEOs;
    private BigDecimal diaEOsRate;
    private BigDecimal vilandi;
    private BigDecimal vRate;
    private BigDecimal stones;
    private BigDecimal vsRate;
    private BigDecimal beadsCtVilandi;
    private BigDecimal vbRate;
    private BigDecimal pearlsGmVilandi;
    private BigDecimal vpRate;
    private BigDecimal ssPearlCt;
    private BigDecimal vssRate;
    private BigDecimal vrealStone;
    private BigDecimal vfitting;
    private BigDecimal vmoz;
    private BigDecimal vmRate;
    private BigDecimal stonesJadtar;
    private BigDecimal jsRate;
    private BigDecimal beadsCtJadtar;
    private BigDecimal jbRate;
    private BigDecimal pearlsGmJadtar;
    private BigDecimal jpRate;
    private BigDecimal ssPearlCtJadtar;
    private BigDecimal jssRate;
    private BigDecimal realStoneJadtar;
    private BigDecimal jfitting;
    private BigDecimal jmoz;
    private BigDecimal jmRate;
    private MultipartFile image;
    private BigDecimal karat;
    private BigDecimal labour;
    private BigDecimal labourAll;
    private BigDecimal ssosPearlCt;
    private BigDecimal ssosPearllbl;
    private String customFields;
    private BigDecimal labourPer;
    private BigDecimal jadvilandi;
    private BigDecimal jadvilandiRate;

    // Getters and Setters
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getProductOrderid() { return productOrderid; }
    public void setProductOrderid(String productOrderid) { this.productOrderid = productOrderid; }

    public BigDecimal getProductPrice() { return productPrice; }
    public void setProductPrice(BigDecimal productPrice) { this.productPrice = productPrice; }

    public String getProductRemarks() { return productRemarks; }
    public void setProductRemarks(String productRemarks) { this.productRemarks = productRemarks; }

    public String getProductImageUrl() { return productImageUrl; }
    public void setProductImageUrl(String productImageUrl) { this.productImageUrl = productImageUrl; }

    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }

    public Long getSubCategoryId() { return subCategoryId; }
    public void setSubCategoryId(Long subCategoryId) { this.subCategoryId = subCategoryId; }

    public BigDecimal getProductNet() { return productNet; }
    public void setProductNet(BigDecimal productNet) { this.productNet = productNet; }

    public Integer getPcs() { return pcs; }
    public void setPcs(Integer pcs) { this.pcs = pcs; }

    public BigDecimal getDiaWeight() { return diaWeight; }
    public void setDiaWeight(BigDecimal diaWeight) { this.diaWeight = diaWeight; }

    public BigDecimal getDiaRate() { return diaRate; }
    public void setDiaRate(BigDecimal diaRate) { this.diaRate = diaRate; }

    public BigDecimal getDiaOs() { return diaOs; }
    public void setDiaOs(BigDecimal diaOs) { this.diaOs = diaOs; }

    public BigDecimal getDiaOsRate() { return diaOsRate; }
    public void setDiaOsRate(BigDecimal diaOsRate) { this.diaOsRate = diaOsRate; }

    public BigDecimal getGross() { return gross; }
    public void setGross(BigDecimal gross) { this.gross = gross; }

    public BigDecimal getVilandiCt() { return vilandiCt; }
    public void setVilandiCt(BigDecimal vilandiCt) { this.vilandiCt = vilandiCt; }

    public BigDecimal getDiamondsCt() { return diamondsCt; }
    public void setDiamondsCt(BigDecimal diamondsCt) { this.diamondsCt = diamondsCt; }

    public BigDecimal getDiamondsCtRate() { return diamondsCtRate; }
    public void setDiamondsCtRate(BigDecimal diamondsCtRate) { this.diamondsCtRate = diamondsCtRate; }

    public BigDecimal getBeadsCt() { return beadsCt; }
    public void setBeadsCt(BigDecimal beadsCt) { this.beadsCt = beadsCt; }

    public BigDecimal getPearlsGm() { return pearlsGm; }
    public void setPearlsGm(BigDecimal pearlsGm) { this.pearlsGm = pearlsGm; }

    public BigDecimal getVilandiRate() { return vilandiRate; }
    public void setVilandiRate(BigDecimal vilandiRate) { this.vilandiRate = vilandiRate; }

    public BigDecimal getBeadsRate() { return beadsRate; }
    public void setBeadsRate(BigDecimal beadsRate) { this.beadsRate = beadsRate; }

    public BigDecimal getOpenPearlsRate() { return openPearlsRate; }
    public void setOpenPearlsRate(BigDecimal openPearlsRate) { this.openPearlsRate = openPearlsRate; }

    public BigDecimal getOtherStonesCt() { return otherStonesCt; }
    public void setOtherStonesCt(BigDecimal otherStonesCt) { this.otherStonesCt = otherStonesCt; }

    public BigDecimal getOtherOsRate() { return otherOsRate; }
    public void setOtherOsRate(BigDecimal otherOsRate) { this.otherOsRate = otherOsRate; }

    public String getOthers() { return others; }
    public void setOthers(String others) { this.others = others; }

    public String getDesignNo() { return designNo; }
    public void setDesignNo(String designNo) { this.designNo = designNo; }

    public Integer getPcsEarrings() { return pcsEarrings; }
    public void setPcsEarrings(Integer pcsEarrings) { this.pcsEarrings = pcsEarrings; }

    public BigDecimal getDiamondsCtEarrings() { return diamondsCtEarrings; }
    public void setDiamondsCtEarrings(BigDecimal diamondsCtEarrings) { this.diamondsCtEarrings = diamondsCtEarrings; }

    public BigDecimal getDiamondsCtEarringsRate() { return diamondsCtEarringsRate; }
    public void setDiamondsCtEarringsRate(BigDecimal diamondsCtEarringsRate) { this.diamondsCtEarringsRate = diamondsCtEarringsRate; }

    public BigDecimal getDiaEOs() { return diaEOs; }
    public void setDiaEOs(BigDecimal diaEOs) { this.diaEOs = diaEOs; }

    public BigDecimal getDiaEOsRate() { return diaEOsRate; }
    public void setDiaEOsRate(BigDecimal diaEOsRate) { this.diaEOsRate = diaEOsRate; }

    public BigDecimal getVilandi() { return vilandi; }
    public void setVilandi(BigDecimal vilandi) { this.vilandi = vilandi; }

    public BigDecimal getvRate() { return vRate; }
    public void setvRate(BigDecimal vRate) { this.vRate = vRate; }

    public BigDecimal getStones() { return stones; }
    public void setStones(BigDecimal stones) { this.stones = stones; }

    public BigDecimal getVsRate() { return vsRate; }
    public void setVsRate(BigDecimal vsRate) { this.vsRate = vsRate; }

    public BigDecimal getBeadsCtVilandi() { return beadsCtVilandi; }
    public void setBeadsCtVilandi(BigDecimal beadsCtVilandi) { this.beadsCtVilandi = beadsCtVilandi; }

    public BigDecimal getVbRate() { return vbRate; }
    public void setVbRate(BigDecimal vbRate) { this.vbRate = vbRate; }

    public BigDecimal getPearlsGmVilandi() { return pearlsGmVilandi; }
    public void setPearlsGmVilandi(BigDecimal pearlsGmVilandi) { this.pearlsGmVilandi = pearlsGmVilandi; }

    public BigDecimal getVpRate() { return vpRate; }
    public void setVpRate(BigDecimal vpRate) { this.vpRate = vpRate; }

    public BigDecimal getSsPearlCt() { return ssPearlCt; }
    public void setSsPearlCt(BigDecimal ssPearlCt) { this.ssPearlCt = ssPearlCt; }

    public BigDecimal getVssRate() { return vssRate; }
    public void setVssRate(BigDecimal vssRate) { this.vssRate = vssRate; }

    public BigDecimal getVrealStone() { return vrealStone; }
    public void setVrealStone(BigDecimal vrealStone) { this.vrealStone = vrealStone; }

    public BigDecimal getVfitting() { return vfitting; }
    public void setVfitting(BigDecimal vfitting) { this.vfitting = vfitting; }

    public BigDecimal getVmoz() { return vmoz; }
    public void setVmoz(BigDecimal vmoz) { this.vmoz = vmoz; }

    public BigDecimal getVmRate() { return vmRate; }
    public void setVmRate(BigDecimal vmRate) { this.vmRate = vmRate; }

    public BigDecimal getStonesJadtar() { return stonesJadtar; }
    public void setStonesJadtar(BigDecimal stonesJadtar) { this.stonesJadtar = stonesJadtar; }

    public BigDecimal getJsRate() { return jsRate; }
    public void setJsRate(BigDecimal jsRate) { this.jsRate = jsRate; }

    public BigDecimal getBeadsCtJadtar() { return beadsCtJadtar; }
    public void setBeadsCtJadtar(BigDecimal beadsCtJadtar) { this.beadsCtJadtar = beadsCtJadtar; }

    public BigDecimal getJbRate() { return jbRate; }
    public void setJbRate(BigDecimal jbRate) { this.jbRate = jbRate; }

    public BigDecimal getPearlsGmJadtar() { return pearlsGmJadtar; }
    public void setPearlsGmJadtar(BigDecimal pearlsGmJadtar) { this.pearlsGmJadtar = pearlsGmJadtar; }

    public BigDecimal getJpRate() { return jpRate; }
    public void setJpRate(BigDecimal jpRate) { this.jpRate = jpRate; }

    public BigDecimal getSsPearlCtJadtar() { return ssPearlCtJadtar; }
    public void setSsPearlCtJadtar(BigDecimal ssPearlCtJadtar) { this.ssPearlCtJadtar = ssPearlCtJadtar; }

    public BigDecimal getJssRate() { return jssRate; }
    public void setJssRate(BigDecimal jssRate) { this.jssRate = jssRate; }

    public BigDecimal getRealStoneJadtar() { return realStoneJadtar; }
    public void setRealStoneJadtar(BigDecimal realStoneJadtar) { this.realStoneJadtar = realStoneJadtar; }

    public BigDecimal getJfitting() { return jfitting; }
    public void setJfitting(BigDecimal jfitting) { this.jfitting = jfitting; }

    public BigDecimal getJmoz() { return jmoz; }
    public void setJmoz(BigDecimal jmoz) { this.jmoz = jmoz; }

    public BigDecimal getJmRate() { return jmRate; }
    public void setJmRate(BigDecimal jmRate) { this.jmRate = jmRate; }

    public MultipartFile getImage() { return image; }
    public void setImage(MultipartFile image) { this.image = image; }

    public BigDecimal getKarat() { return karat; }
    public void setKarat(BigDecimal karat) { this.karat = karat; }

    public BigDecimal getLabour() { return labour; }
    public void setLabour(BigDecimal labour) { this.labour = labour; }

    public BigDecimal getLabourAll() { return labourAll; }
    public void setLabourAll(BigDecimal labourAll) { this.labourAll = labourAll; }

    public BigDecimal getSsosPearlCt() { return ssosPearlCt; }
    public void setSsosPearlCt(BigDecimal ssosPearlCt) { this.ssosPearlCt = ssosPearlCt; }

    public BigDecimal getSsosPearllbl() { return ssosPearllbl; }
    public void setSsosPearllbl(BigDecimal ssosPearllbl) { this.ssosPearllbl = ssosPearllbl; }

    public String getCustomFields() { return customFields; }
    public void setCustomFields(String customFields) { this.customFields = customFields; }

    public BigDecimal getLabourPer() { return labourPer; }
    public void setLabourPer(BigDecimal labourPer) { this.labourPer = labourPer; }

    public BigDecimal getJadvilandi() { return jadvilandi; }
    public void setJadvilandi(BigDecimal jadvilandi) { this.jadvilandi = jadvilandi; }

    public BigDecimal getJadvilandiRate() { return jadvilandiRate; }
    public void setJadvilandiRate(BigDecimal jadvilandiRate) { this.jadvilandiRate = jadvilandiRate; }
}
