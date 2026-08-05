const xml = `
<CP:msGeometry>
<gml:Polygon gml:id="CadastralParcel.IT.AGE.PLA.E549_000400.104.1" srsName="urn:ogc:def:crs:EPSG::6706">
<gml:exterior>
<gml:LinearRing>
<gml:posList srsDimension="2">41.89146035 15.28420114 41.89215628 15.28474887 41.89225491 15.28478164 </gml:posList>
</gml:LinearRing>
</gml:exterior>
</gml:Polygon>
</CP:msGeometry>
`;
const posListMatch = xml.match(/<gml:posList[^>]*>(.*?)<\/gml:posList>/);
console.log(posListMatch ? posListMatch[1] : "NO MATCH");
