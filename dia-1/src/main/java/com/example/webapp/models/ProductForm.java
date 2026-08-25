package com.example.webapp.models;

import java.math.BigDecimal;
import org.springframework.web.multipart.MultipartFile;

public class ProductForm {
    private String productName;
    private BigDecimal price;
    private Integer stockQuantity;
    private Integer categoryId;
    private MultipartFile imageUrl;
    private String orderId;

    private BigDecimal net;
    private BigDecimal chainNet;
    private Integer pcs;
    private BigDecimal diaWeight;
    private BigDecimal diaRate;
    private BigDecimal diaSt;
    private BigDecimal diaStRate;
    private String remarks;

    private BigDecimal gross;
    private BigDecimal vilandiCt;
    private BigDecimal diamondsCt;
    private BigDecimal diamondsCtRate;
    private BigDecimal otherStonesCt;
    private BigDecimal openStRate;
    private BigDecimal beadsCt;
    private BigDecimal pearlsGm;
    private String others;
    private String designNoOS;
    private String designNoDR;
    private String designNo;
    private String designNoEarring;
    private String designNoVilandi;
    private String designNoJadtar;
    private BigDecimal earringNet;
    private Integer earringPcs;
    private BigDecimal diamondWeightEarring;
    private BigDecimal diamondsWtRate;
    private BigDecimal earSt;
    private BigDecimal earStRate;
    private BigDecimal vilandi;
    private BigDecimal vilandiRate;
    private BigDecimal stones;
    private BigDecimal vilandiStoneRate;
    private BigDecimal beadsVilandi;
    private BigDecimal vilandiBeadsRate;
    private BigDecimal pearlsVilandi;
    private BigDecimal vilandiPearlRate;
    private BigDecimal ssPearlCt;
    private BigDecimal vilandiSSPearlRate;
    private BigDecimal realStone;
    private BigDecimal vilandiFitting;
    private BigDecimal jadtarGross;
    private BigDecimal jadtarNet;
    private BigDecimal jadtarStones;
    private BigDecimal jadtarStoneRate;
    private BigDecimal jadtarBeads;
    private BigDecimal jadtarBeadsRate;
    private BigDecimal jadtarPearls;
    private BigDecimal jadtarPearlRate;
    private BigDecimal jadtarSSPearl;
    private BigDecimal jadtarSSPearlRate;
    private BigDecimal jadtarRealStone;
    private BigDecimal jadtarFitting;
    private BigDecimal mozStone;
    private BigDecimal mozStoneRate;
    private BigDecimal karatId;
    private BigDecimal drLabour;
    private BigDecimal osLabour;
    private BigDecimal chainLabour;
    private BigDecimal diamondLabour;
    private BigDecimal vilandiLabour;
    private BigDecimal jadtarLabour;
    private BigDecimal drLabourAll;
    private BigDecimal osLabourAll;
    private BigDecimal chainLabourAll;
    private BigDecimal diamondLabourAll;
    private BigDecimal vilandiLabourAll;
    private BigDecimal jadtarLabourAll;
    private Long subCategoryId;
    private BigDecimal diamondGross;
    private BigDecimal earringGross;
    private BigDecimal chainGross;
    private BigDecimal ssPearlCts;
    private BigDecimal osSSPearlRate;
    private BigDecimal vilandiGross;
    private String customFields;
    private BigDecimal drLabourP;
    private BigDecimal osLabourP;
    private BigDecimal chainLabourP;
    private BigDecimal vilandiLabourP;
    private BigDecimal jadtarLabourP;
    private BigDecimal jadvilandi;
    private BigDecimal jadvilandiRate;

    // Getters and Setters
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }

    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }

    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }

    public MultipartFile getImageUrl() { return imageUrl; }
    public void setImageUrl(MultipartFile imageUrl) { this.imageUrl = imageUrl; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public BigDecimal getNet() { return net; }
    public void setNet(BigDecimal net) { this.net = net; }

    public BigDecimal getChainNet() { return chainNet; }
    public void setChainNet(BigDecimal chainNet) { this.chainNet = chainNet; }

    public Integer getPcs() { return pcs; }
    public void setPcs(Integer pcs) { this.pcs = pcs; }

    public BigDecimal getDiaWeight() { return diaWeight; }
    public void setDiaWeight(BigDecimal diaWeight) { this.diaWeight = diaWeight; }

    public BigDecimal getDiaRate() { return diaRate; }
    public void setDiaRate(BigDecimal diaRate) { this.diaRate = diaRate; }

    public BigDecimal getDiaSt() { return diaSt; }
    public void setDiaSt(BigDecimal diaSt) { this.diaSt = diaSt; }

    public BigDecimal getDiaStRate() { return diaStRate; }
    public void setDiaStRate(BigDecimal diaStRate) { this.diaStRate = diaStRate; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public BigDecimal getGross() { return gross; }
    public void setGross(BigDecimal gross) { this.gross = gross; }

    public BigDecimal getVilandiCt() { return vilandiCt; }
    public void setVilandiCt(BigDecimal vilandiCt) { this.vilandiCt = vilandiCt; }

    public BigDecimal getDiamondsCt() { return diamondsCt; }
    public void setDiamondsCt(BigDecimal diamondsCt) { this.diamondsCt = diamondsCt; }

    public BigDecimal getDiamondsCtRate() { return diamondsCtRate; }
    public void setDiamondsCtRate(BigDecimal diamondsCtRate) { this.diamondsCtRate = diamondsCtRate; }

    public BigDecimal getOtherStonesCt() { return otherStonesCt; }
    public void setOtherStonesCt(BigDecimal otherStonesCt) { this.otherStonesCt = otherStonesCt; }

    public BigDecimal getOpenStRate() { return openStRate; }
    public void setOpenStRate(BigDecimal openStRate) { this.openStRate = openStRate; }

    public BigDecimal getBeadsCt() { return beadsCt; }
    public void setBeadsCt(BigDecimal beadsCt) { this.beadsCt = beadsCt; }

    public BigDecimal getPearlsGm() { return pearlsGm; }
    public void setPearlsGm(BigDecimal pearlsGm) { this.pearlsGm = pearlsGm; }

    public String getOthers() { return others; }
    public void setOthers(String others) { this.others = others; }

    public String getDesignNoOS() { return designNoOS; }
    public void setDesignNoOS(String designNoOS) { this.designNoOS = designNoOS; }

    public String getDesignNoDR() { return designNoDR; }
    public void setDesignNoDR(String designNoDR) { this.designNoDR = designNoDR; }

    public String getDesignNo() { return designNo; }
    public void setDesignNo(String designNo) { this.designNo = designNo; }

    public String getDesignNoEarring() { return designNoEarring; }
    public void setDesignNoEarring(String designNoEarring) { this.designNoEarring = designNoEarring; }

    public String getDesignNoVilandi() { return designNoVilandi; }
    public void setDesignNoVilandi(String designNoVilandi) { this.designNoVilandi = designNoVilandi; }

    public String getDesignNoJadtar() { return designNoJadtar; }
    public void setDesignNoJadtar(String designNoJadtar) { this.designNoJadtar = designNoJadtar; }

    public BigDecimal getEarringNet() { return earringNet; }
    public void setEarringNet(BigDecimal earringNet) { this.earringNet = earringNet; }

    public Integer getEarringPcs() { return earringPcs; }
    public void setEarringPcs(Integer earringPcs) { this.earringPcs = earringPcs; }

    public BigDecimal getDiamondWeightEarring() { return diamondWeightEarring; }
    public void setDiamondWeightEarring(BigDecimal diamondWeightEarring) { this.diamondWeightEarring = diamondWeightEarring; }

    public BigDecimal getDiamondsWtRate() { return diamondsWtRate; }
    public void setDiamondsWtRate(BigDecimal diamondsWtRate) { this.diamondsWtRate = diamondsWtRate; }

    public BigDecimal getEarSt() { return earSt; }
    public void setEarSt(BigDecimal earSt) { this.earSt = earSt; }

    public BigDecimal getEarStRate() { return earStRate; }
    public void setEarStRate(BigDecimal earStRate) { this.earStRate = earStRate; }

    public BigDecimal getVilandi() { return vilandi; }
    public void setVilandi(BigDecimal vilandi) { this.vilandi = vilandi; }

    public BigDecimal getVilandiRate() { return vilandiRate; }
    public void setVilandiRate(BigDecimal vilandiRate) { this.vilandiRate = vilandiRate; }

    public BigDecimal getStones() { return stones; }
    public void setStones(BigDecimal stones) { this.stones = stones; }

    public BigDecimal getVilandiStoneRate() { return vilandiStoneRate; }
    public void setVilandiStoneRate(BigDecimal vilandiStoneRate) { this.vilandiStoneRate = vilandiStoneRate; }

    public BigDecimal getBeadsVilandi() { return beadsVilandi; }
    public void setBeadsVilandi(BigDecimal beadsVilandi) { this.beadsVilandi = beadsVilandi; }

    public BigDecimal getVilandiBeadsRate() { return vilandiBeadsRate; }
    public void setVilandiBeadsRate(BigDecimal vilandiBeadsRate) { this.vilandiBeadsRate = vilandiBeadsRate; }

    public BigDecimal getPearlsVilandi() { return pearlsVilandi; }
    public void setPearlsVilandi(BigDecimal pearlsVilandi) { this.pearlsVilandi = pearlsVilandi; }

    public BigDecimal getVilandiPearlRate() { return vilandiPearlRate; }
    public void setVilandiPearlRate(BigDecimal vilandiPearlRate) { this.vilandiPearlRate = vilandiPearlRate; }

    public BigDecimal getSsPearlCt() { return ssPearlCt; }
    public void setSsPearlCt(BigDecimal ssPearlCt) { this.ssPearlCt = ssPearlCt; }

    public BigDecimal getVilandiSSPearlRate() { return vilandiSSPearlRate; }
    public void setVilandiSSPearlRate(BigDecimal vilandiSSPearlRate) { this.vilandiSSPearlRate = vilandiSSPearlRate; }

    public BigDecimal getRealStone() { return realStone; }
    public void setRealStone(BigDecimal realStone) { this.realStone = realStone; }

    public BigDecimal getVilandiFitting() { return vilandiFitting; }
    public void setVilandiFitting(BigDecimal vilandiFitting) { this.vilandiFitting = vilandiFitting; }

    public BigDecimal getJadtarGross() { return jadtarGross; }
    public void setJadtarGross(BigDecimal jadtarGross) { this.jadtarGross = jadtarGross; }

    public BigDecimal getJadtarNet() { return jadtarNet; }
    public void setJadtarNet(BigDecimal jadtarNet) { this.jadtarNet = jadtarNet; }

    public BigDecimal getJadtarStones() { return jadtarStones; }
    public void setJadtarStones(BigDecimal jadtarStones) { this.jadtarStones = jadtarStones; }

    public BigDecimal getJadtarStoneRate() { return jadtarStoneRate; }
    public void setJadtarStoneRate(BigDecimal jadtarStoneRate) { this.jadtarStoneRate = jadtarStoneRate; }

    public BigDecimal getJadtarBeads() { return jadtarBeads; }
    public void setJadtarBeads(BigDecimal jadtarBeads) { this.jadtarBeads = jadtarBeads; }

    public BigDecimal getJadtarBeadsRate() { return jadtarBeadsRate; }
    public void setJadtarBeadsRate(BigDecimal jadtarBeadsRate) { this.jadtarBeadsRate = jadtarBeadsRate; }

    public BigDecimal getJadtarPearls() { return jadtarPearls; }
    public void setJadtarPearls(BigDecimal jadtarPearls) { this.jadtarPearls = jadtarPearls; }

    public BigDecimal getJadtarPearlRate() { return jadtarPearlRate; }
    public void setJadtarPearlRate(BigDecimal jadtarPearlRate) { this.jadtarPearlRate = jadtarPearlRate; }

    public BigDecimal getJadtarSSPearl() { return jadtarSSPearl; }
    public void setJadtarSSPearl(BigDecimal jadtarSSPearl) { this.jadtarSSPearl = jadtarSSPearl; }

    public BigDecimal getJadtarSSPearlRate() { return jadtarSSPearlRate; }
    public void setJadtarSSPearlRate(BigDecimal jadtarSSPearlRate) { this.jadtarSSPearlRate = jadtarSSPearlRate; }

    public BigDecimal getJadtarRealStone() { return jadtarRealStone; }
    public void setJadtarRealStone(BigDecimal jadtarRealStone) { this.jadtarRealStone = jadtarRealStone; }

    public BigDecimal getJadtarFitting() { return jadtarFitting; }
    public void setJadtarFitting(BigDecimal jadtarFitting) { this.jadtarFitting = jadtarFitting; }

    public BigDecimal getMozStone() { return mozStone; }
    public void setMozStone(BigDecimal mozStone) { this.mozStone = mozStone; }

    public BigDecimal getMozStoneRate() { return mozStoneRate; }
    public void setMozStoneRate(BigDecimal mozStoneRate) { this.mozStoneRate = mozStoneRate; }

    public BigDecimal getKaratId() { return karatId; }
    public void setKaratId(BigDecimal karatId) { this.karatId = karatId; }

    public BigDecimal getDrLabour() { return drLabour; }
    public void setDrLabour(BigDecimal drLabour) { this.drLabour = drLabour; }

    public BigDecimal getOsLabour() { return osLabour; }
    public void setOsLabour(BigDecimal osLabour) { this.osLabour = osLabour; }

    public BigDecimal getChainLabour() { return chainLabour; }
    public void setChainLabour(BigDecimal chainLabour) { this.chainLabour = chainLabour; }

    public BigDecimal getDiamondLabour() { return diamondLabour; }
    public void setDiamondLabour(BigDecimal diamondLabour) { this.diamondLabour = diamondLabour; }

    public BigDecimal getVilandiLabour() { return vilandiLabour; }
    public void setVilandiLabour(BigDecimal vilandiLabour) { this.vilandiLabour = vilandiLabour; }

    public BigDecimal getJadtarLabour() { return jadtarLabour; }
    public void setJadtarLabour(BigDecimal jadtarLabour) { this.jadtarLabour = jadtarLabour; }

    public BigDecimal getDrLabourAll() { return drLabourAll; }
    public void setDrLabourAll(BigDecimal drLabourAll) { this.drLabourAll = drLabourAll; }

    public BigDecimal getOsLabourAll() { return osLabourAll; }
    public void setOsLabourAll(BigDecimal osLabourAll) { this.osLabourAll = osLabourAll; }

    public BigDecimal getChainLabourAll() { return chainLabourAll; }
    public void setChainLabourAll(BigDecimal chainLabourAll) { this.chainLabourAll = chainLabourAll; }

    public BigDecimal getDiamondLabourAll() { return diamondLabourAll; }
    public void setDiamondLabourAll(BigDecimal diamondLabourAll) { this.diamondLabourAll = diamondLabourAll; }

    public BigDecimal getVilandiLabourAll() { return vilandiLabourAll; }
    public void setVilandiLabourAll(BigDecimal vilandiLabourAll) { this.vilandiLabourAll = vilandiLabourAll; }

    public BigDecimal getJadtarLabourAll() { return jadtarLabourAll; }
    public void setJadtarLabourAll(BigDecimal jadtarLabourAll) { this.jadtarLabourAll = jadtarLabourAll; }

    public Long getSubCategoryId() { return subCategoryId; }
    public void setSubCategoryId(Long subCategoryId) { this.subCategoryId = subCategoryId; }

    public BigDecimal getDiamondGross() { return diamondGross; }
    public void setDiamondGross(BigDecimal diamondGross) { this.diamondGross = diamondGross; }

    public BigDecimal getEarringGross() { return earringGross; }
    public void setEarringGross(BigDecimal earringGross) { this.earringGross = earringGross; }

    public BigDecimal getChainGross() { return chainGross; }
    public void setChainGross(BigDecimal chainGross) { this.chainGross = chainGross; }

    public BigDecimal getSsPearlCts() { return ssPearlCts; }
    public void setSsPearlCts(BigDecimal ssPearlCts) { this.ssPearlCts = ssPearlCts; }

    public BigDecimal getOsSSPearlRate() { return osSSPearlRate; }
    public void setOsSSPearlRate(BigDecimal osSSPearlRate) { this.osSSPearlRate = osSSPearlRate; }

    public BigDecimal getVilandiGross() { return vilandiGross; }
    public void setVilandiGross(BigDecimal vilandiGross) { this.vilandiGross = vilandiGross; }

    public String getCustomFields() { return customFields; }
    public void setCustomFields(String customFields) { this.customFields = customFields; }

    public BigDecimal getDrLabourP() { return drLabourP; }
    public void setDrLabourP(BigDecimal drLabourP) { this.drLabourP = drLabourP; }

    public BigDecimal getOsLabourP() { return osLabourP; }
    public void setOsLabourP(BigDecimal osLabourP) { this.osLabourP = osLabourP; }

    public BigDecimal getChainLabourP() { return chainLabourP; }
    public void setChainLabourP(BigDecimal chainLabourP) { this.chainLabourP = chainLabourP; }

    public BigDecimal getVilandiLabourP() { return vilandiLabourP; }
    public void setVilandiLabourP(BigDecimal vilandiLabourP) { this.vilandiLabourP = vilandiLabourP; }

    public BigDecimal getJadtarLabourP() { return jadtarLabourP; }
    public void setJadtarLabourP(BigDecimal jadtarLabourP) { this.jadtarLabourP = jadtarLabourP; }

    public BigDecimal getJadvilandi() { return jadvilandi; }
    public void setJadvilandi(BigDecimal jadvilandi) { this.jadvilandi = jadvilandi; }

    public BigDecimal getJadvilandiRate() { return jadvilandiRate; }
    public void setJadvilandiRate(BigDecimal jadvilandiRate) { this.jadvilandiRate = jadvilandiRate; }
}
