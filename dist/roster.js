export const CATEGORIES = [
  {id:'primary',name:'Primários',icon:'target',color:'#83c9ff',card:['#172c46','#2c5c89','#3e6392']},
  {id:'military',name:'Militares',icon:'crosshair',color:'#abed89',card:['#1d3729','#497648','#496e42']},
  {id:'magic',name:'Mágicos',icon:'spark',color:'#e4b6ff',card:['#342340','#684487','#684e82']},
  {id:'support',name:'Suporte',icon:'tower',color:'#ffbf81',card:['#432c21','#805233','#86573a']},
  {id:'hero',name:'Heróis',icon:'medal',color:'#ffe28b',card:['#3b321e','#846a3b','#7c643d']}
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map(category=>[category.id,category]));

const path = (name,icon,detail,changes,price=1) => ({name,icon,detail,changes,price});
const force = (name,detail,damage=1,extra={},price=1.16) => path(name,'target',detail,[
  {damage}, {damage,...extra}, {damage:damage*2}, {damage:damage*2}, {damage:damage*3}
],price);
const reach = (name,detail,extra={},price=1) => path(name,'range',detail,[
  {range:.6}, {range:.6,...extra}, {range:.67}, {range:.7,damage:1}, {range:.9,damage:2}
],price);
const rhythm = (name,detail,decrease=.08,extra={},price=1.06) => path(name,'bolt',detail,[
  {rate:-decrease}, {rate:-decrease,...extra}, {rate:-decrease,damage:1}, {rate:-decrease,damage:1}, {rate:-decrease,damage:2}
],price);
const colors = (skin,belly,crest,tint) => [skin,belly,crest,tint];

function dino(id,category,name,species,role,icon,price,plan,palette,desc,stats,paths){
  return {id,category,name,species,role,icon,price,plan,palette,desc,stats,paths};
}

export const TOWERS = [
  dino('scout','primary','Psitaco','Psittacosaurus','Mordida','target',190,'beak',colors('#71a452','#f3cd80','#365f4d','#bad885'),
    'Avança e fecha o bico nos balões. Uma defesa versátil para as primeiras ondas.',
    {range:4.35,rate:.66,damage:1},[
      path('Bico robusto','target','Mordidas mais fortes. No nível 2, rompe Liga.',[{damage:1},{damage:1,armor:true},{damage:2},{damage:2,pierce:1},{damage:4}],1.08),
      path('Olhar atento','range','Alcance maior. Revela Véus no nível 2.',[{range:.8},{range:.6,detect:true},{range:.6,pierce:1},{range:.55,damage:1},{range:.8,pierce:2}]),
      path('Bicadas velozes','bolt','Mordidas mais rápidas que alcançam mais alvos.',[{rate:-.12,pierce:1},{rate:-.08},{rate:-.06,pierce:1},{rate:-.06,damage:1},{rate:-.07,pierce:2}],1.02)
    ]),
  dino('loop','primary','Estegossauro','Stegosaurus','Varredura de cauda','loop',235,'plates',colors('#55a297','#b2dfa0','#f3aa62','#dd716d'),
    'Gira de lado e varre vários balões com os espinhos da cauda.',
    {range:4.55,rate:1.12,damage:1,pierce:5,style:'boomerang'},[
      force('Cauda vulcânica','Mais dano. A partir do nível 2, rompe Liga.',1,{armor:true}),
      path('Arco amplo','range','Mais alcance e capacidade de acerto.',[{range:.6,pierce:1},{range:.65,pierce:2},{pierce:2},{range:.5,pierce:3},{pierce:4,damage:2}]),
      rhythm('Giro veloz','Gira com mais frequência e acerta mais alvos.',.14,{pierce:2})
    ]),
  dino('cannon','primary','Anquilossauro','Ankylosaurus','Caudada de impacto','bolt',315,'armor',colors('#668596','#c4cda0','#dc885a','#eaab68'),
    'A clava na ponta da cauda rompe Liga e abala grupos. Basalto e Listrado resistem ao impacto.',
    {range:4.6,rate:1.33,damage:2,splash:1.52,armor:true,style:'bomb',channel:'blast',lob:true},[
      path('Clava pesada','target','Causa mais dano a balões de casca grossa.',[{damage:2},{damage:2},{damage:4,splash:.2},{damage:6},{damage:10,splash:.2}],1.28),
      path('Cratera','range','Expande a área de impacto da cauda.',[{splash:.45,range:.15},{splash:.4},{splash:.45,damage:1},{splash:.5,damage:1},{splash:.6,damage:4}],1.12),
      path('Cauda ágil','bolt','Encurta o intervalo entre caudadas.',[{rate:-.24},{rate:-.17},{rate:-.15,damage:1},{rate:-.17,range:.4},{rate:-.16,damage:3}],1.1)
    ]),
  dino('quills','primary','Kentrossauro','Kentrosaurus','Giro espinhoso','spark',245,'spines',colors('#b67b6f','#f0c995','#efda8a','#cf7554'),
    'Gira com os espinhos eriçados para atingir os balões ao redor. Funciona bem junto a curvas.',
    {range:2.52,rate:.77,damage:1,style:'burst'},[
      force('Espinhos rígidos','Aumenta o dano. Penetra Liga no nível 2.',1,{armor:true}),
      reach('Onda de espinhos','Atinge um raio maior em todas as direções.'),
      rhythm('Pele eriçada','Encurta o intervalo entre giros.',.09)
    ]),
  dino('frost','primary','Paquicefalo','Pachycephalosaurus','Gelo','snow',275,'dome',colors('#71a5c4','#d4e8d1','#a6e3e6','#777ad9'),
    'Sopra uma nuvem gelada que atrasa grupos. Giz e Listrado resistem ao frio.',
    {range:3.75,rate:1.08,damage:1,splash:1.16,slow:.47,duration:1.6,style:'frost',channel:'frost',lob:true},[
      path('Gelo cortante','target','Mais dano e, no nível 2, quebra Liga.',[{damage:1},{armor:true,damage:1},{damage:2},{damage:2,splash:.3},{damage:4}],1.12),
      path('Nevasca','range','Pulsos mais amplos, com frio duradouro.',[{splash:.42,duration:.35},{range:.5,splash:.3},{duration:.6,splash:.35},{range:.65,splash:.4},{splash:.6,damage:2}],1.04),
      path('Frio profundo','bolt','Pulsos rápidos e lentidão mais intensa.',[{slow:.13,duration:.3},{rate:-.17},{slow:.12,duration:.4},{rate:-.19,damage:1},{slow:.08,rate:-.12}],1.08)
    ]),
  dino('glue','primary','Dilofossauro','Dilophosaurus','Resina','drop',210,'twin',colors('#b89b52','#f3d981','#dc783f','#e3555e'),
    'Cospe resina que retarda os balões. A especialização Corrosão adiciona dano ao longo do tempo.',
    {range:4.1,rate:1.03,damage:0,splash:.7,slow:.70,duration:3.2,style:'resin',armor:true},[
      path('Corrosão','target','A resina começa a causar dano ao longo do tempo.',[{corrosion:1},{corrosion:1},{corrosion:2},{corrosion:2},{corrosion:3}]),
      path('Resina em leque','range','A cola se espalha para grupos.',[{splash:.6},{splash:.38,range:.35},{splash:.48},{splash:.5,duration:.5},{splash:.65,range:.4}]),
      path('Passos presos','bolt','A resina dura mais e é aplicada com mais frequência.',[{duration:1},{rate:-.24},{duration:1.2},{rate:-.17,slow:.1},{rate:-.16,duration:1.6}])
    ]),
  dino('sniper','military','Velociraptor','Velociraptor','Rugido de longo alcance','crosshair',460,'raptor',colors('#97a657','#f2dda6','#486a46','#d7ae64'),
    'Concentra o rugido em alvos individuais por toda a ilha. Pedras bloqueiam o ataque.',
    {range:40,rate:1.58,damage:4,style:'shot'},[
      force('Rugido grave','Mais dano. O rugido rompe Liga no nível 2.',3,{armor:true},1.3),
      path('Olho da ravina','range','Detecta Véus no nível 2 e atravessa vários alvos.',[{damage:1},{detect:true,pierce:1},{pierce:2},{damage:2,pierce:1},{damage:4,pierce:3}],1.18),
      rhythm('Fôlego longo','Reduz o intervalo entre rugidos.',.22,{},1.2)
    ]),
  dino('sub','military','Espinossauro','Spinosaurus','Aquático','waves',365,'sail',colors('#478c93','#c3e5ae','#e2a86a','#5ce0d0'),
    'Sai da água para morder. Com a ajuda de aliados, pode rugir contra alvos distantes.',
    {range:5.05,rate:.63,damage:1,terrain:'water',style:'torpedo'},[
      force('Mandíbula de rio','Mais dano. Rompe Liga no nível 2.',1,{armor:true}),
      path('Patrulha em rede','range','No nível 2, usa o alcance de outras torres.',[{range:.65},{network:true},{damage:1},{pierce:1},{range:1,damage:3,pierce:2}],1.14),
      rhythm('Corrente rápida','Ataca mais depressa em qualquer rota.',.07)
    ]),
  dino('corsair','military','Barionix','Baryonyx','Flancos na água','waves',410,'croc',colors('#598666','#c5d59a','#e5ae79','#7cd6b6'),
    'Bate a cauda nos dois flancos. Na linhagem Cauda de ressaca, o golpe gera uma onda de choque.',
    {range:5.25,rate:.88,damage:2,terrain:'water',style:'broadside',flanks:true},[
      path('Cauda de ressaca','target','A onda de choque da cauda rompe Liga.',[{splash:1.15,channel:'blast',armor:true,style:'bomb',lob:true},{damage:2},{splash:.3,damage:2},{damage:3},{damage:5,splash:.4}],1.18),
      reach('Costas abertas','Maior alcance. Vê Véus no nível 2.',{detect:true}),
      rhythm('Maré veloz','Dá caudadas mais rápidas pelos dois flancos.',.105,{pierce:1})
    ]),
  dino('wing','military','Microraptor','Microraptor','Voo de patrulha','feather',420,'wing',colors('#5680a4','#b4d6e0','#ec9766','#8acbc4'),
    'Voa em torno do poleiro e mergulha sobre os balões. Altere o padrão de voo no painel.',
    {range:3.2,rate:.61,damage:2,motion:'wing',style:'bolt',lob:true},[
      path('Mergulho de choque','target','A partir do nível 2, o impacto atinge vários balões.',[{damage:1},{style:'bomb',channel:'blast',splash:.9,armor:true},{damage:2},{splash:.5,damage:2},{damage:4}],1.24),
      reach('Asas de vigia','Maior cobertura. Detecta Véus no nível 2.',{detect:true}),
      rhythm('Voo rasante','Mergulha mais depressa.',.065,{pierce:1})
    ]),
  dino('pilot','military','Yi','Yi qi','Voo dirigido','feather',515,'glider',colors('#9a7069','#f5cc98','#726694','#efab7f'),
    'Plana até o cursor ou um ponto marcado e mergulha sobre os balões com as garras.',
    {range:3.45,rate:.54,damage:2,motion:'pilot',style:'bolt',lob:true},[
      force('Garras reforçadas','Mais dano. Perfura Liga no nível 2.',1,{armor:true},1.28),
      reach('Vigia do desfiladeiro','Alcance maior e detecção no nível 2.',{detect:true}),
      rhythm('Asa ágil','Mergulhos rápidos e maior velocidade de voo.',.065,{flightSpeed:2})
    ]),
  dino('mortar','military','Tricerato','Triceratops','Pisada sísmica','radar',490,'horns',colors('#a47f61','#efe1a5','#bf735c','#e3b265'),
    'Bate as patas no chão e faz tremer o trecho marcado da trilha.',
    {range:40,rate:1.73,damage:3,splash:1.78,style:'mortar',channel:'blast',armor:true,lob:true},[
      force('Patas pesadas','Aumenta a potência da pisada.',3,{},1.25),
      path('Impacto amplo','range','Cobre mais trilha a cada impacto.',[{splash:.6},{splash:.5},{splash:.45},{splash:.5,damage:2},{splash:.55,damage:4}],1.08),
      rhythm('Passos ritmados','Encurta o intervalo entre impactos.',.25,{},1.14)
    ]),
  dino('gunner','military','Ceratossauro','Ceratosaurus','Rugido dirigido','crosshair',445,'blade',colors('#98695b','#ebc890','#dc6961','#e5bc6c'),
    'Ruge em direção ao cursor. Você também pode fixar a direção do rugido no painel.',
    {range:12,rate:.27,damage:1,style:'aimed',pierce:2},[
      force('Garganta grave','Mais dano. Rompe Liga no nível 2.',1,{armor:true},1.22),
      path('Ressonância','range','Rugido mais longo que atravessa grupos.',[{range:2,pierce:1},{detect:true,pierce:1},{range:2,pierce:2},{damage:1,pierce:2},{damage:3,pierce:3}]),
      rhythm('Fôlego contínuo','Aumenta a cadência.',.025,{pierce:1})
    ]),
  dino('prism','magic','Parasauro','Parasaurolophus','Sopro arcano','spark',440,'crest',colors('#9c80c1','#efc9ac','#c278aa','#ead5a3'),
    'Sopra energia capaz de romper Liga. Opala absorve magia.',
    {range:5.8,rate:.95,damage:3,style:'prism',channel:'arcane',armor:true},[
      path('Sopro solar','target','Concentra energia contra cascas resistentes.',[{damage:2},{damage:3},{damage:5},{damage:7},{damage:11}],1.4),
      path('Espectro','range','Revela Véus e amplia o alcance do sopro.',[{detect:true,range:.5},{range:.65},{range:.7,pierce:1},{range:.8,damage:3},{range:1,pierce:2}],1.18),
      path('Difração','bolt','O sopro alcança mais alvos.',[{pierce:1,rate:-.1},{pierce:1},{rate:-.12,damage:1},{pierce:2,rate:-.1},{pierce:2,damage:3}],1.2)
    ]),
  dino('super','magic','Tiranossauro','Tyrannosaurus','Salto arcano','bolt',995,'rex',colors('#b9716e','#f2cb97','#7e5869','#f7a78c'),
    'Salta sobre os balões em rápida sucessão. Cada linhagem cria espinhos, placas e escamas próprias.',
    {range:5.05,rate:.22,damage:2,style:'prism',channel:'arcane',armor:true},[
      force('Crista solar','Mais dano e alvos por salto.',2,{pierce:1},1.8),
      path('Carapaça sideral','range','Cristais ampliam alcance e detecção.',[{range:.7},{detect:true,range:.8},{range:.8,pierce:1},{damage:2,range:.65},{range:1,damage:4}],1.52),
      rhythm('Tempestade ígnea','Saltos mais rápidos e fortes.',.018,{pierce:1},1.62)
    ]),
  dino('hive','magic','Deinonico','Deinonychus','Caça furtiva','feather',365,'plume',colors('#667f9c','#c4d9c3','#b292ce','#edb77d'),
    'Detecta Véus por conta própria e corta os balões com garradas rápidas.',
    {range:4.22,rate:.34,damage:1,detect:true,style:'bolt'},[
      path('Garras curvas','target','Mais dano. Rompe Liga no nível 2.',[{damage:1},{armor:true,damage:1},{damage:1},{damage:2},{damage:4}],1.22),
      path('Garrada de choque','range','No nível 2, o golpe passa a atingir uma área.',[{range:.5},{splash:.68,style:'bomb',channel:'blast',armor:true,lob:true},{splash:.25},{range:.6,damage:1},{splash:.35,damage:3}],1.16),
      path('Bando veloz','bolt','Mais cadência e alvos por garrada.',[{rate:-.06,pierce:1},{rate:-.045},{pierce:1,rate:-.035},{damage:1,rate:-.035},{pierce:2,damage:2}],1.12)
    ]),
  dino('brew','magic','Protocerato','Protoceratops','Secreções naturais','drop',415,'frill',colors('#b28cb3','#f2cda6','#755988','#a9dfa6'),
    'Cospe ácido nos balões e libera um aroma que acelera os aliados próximos.',
    {range:3.85,rate:.96,damage:1,splash:.78,corrosion:1,style:'resin',armor:true,aura:.12,auraRadius:3.25},[
      path('Fermento ácido','target','Ácido mais potente e área maior.',[{corrosion:1},{damage:1,splash:.3},{corrosion:2},{damage:2},{corrosion:3,splash:.4}],1.16),
      path('Fortificante','range','O aroma fortalece os golpes e o alcance dos aliados.',[{auraRange:.4},{auraDamage:1},{auraRadius:.6},{auraRange:.5},{auraDamage:2,auraRadius:.6}],1.2),
      rhythm('Glândulas ativas','Cospe ácido mais depressa e melhora a aura.',.11,{aura:.11})
    ]),
  dino('grove','magic','Iguanodonte','Iguanodon','Giro da floresta','leaf',395,'thumbs',colors('#699f62','#d8e2ac','#c4a961','#81c88d'),
    'Varre os balões com a cauda e fica mais rápido quando a trilha está cheia.',
    {range:4.4,rate:.69,damage:2,pierce:2,crowd:true,style:'bolt'},[
      force('Cauda espinhosa','Mais dano. Rompe Liga no nível 2.',1,{armor:true}),
      path('Vendaval do bosque','range','A partir do nível 2, rajadas empurram grupos.',[{range:.6},{splash:1.1,knock:.65,style:'prism',channel:'arcane'},{range:.7},{splash:.5,knock:.4},{damage:4,knock:.6}],1.2),
      rhythm('Surto de folhas','Ataca ainda mais depressa em multidões.',.085,{pierce:1})
    ]),
  dino('tide','magic','Halszkaraptor','Halszkaraptor','Anfíbio','waves',390,'duck',colors('#4b9eab','#f5d598','#6d81b9','#89e6d7'),
    'Vive na terra ou na água. Seu canto de maré desacelera grupos de balões.',
    {range:4,rate:.92,damage:1,splash:1.18,slow:.39,duration:1.85,terrain:'both',style:'tide',channel:'arcane',armor:true,lob:true},[
      force('Canto abissal','Aumenta o dano das ondas aquáticas.',1,{splash:.3}),
      path('Corrente hipnótica','range','O canto retarda por mais tempo e empurra balões.',[{slow:.13},{knock:.5,duration:.5},{splash:.4},{slow:.13,splash:.35},{knock:.65,duration:1.3}],1.14),
      rhythm('Refrão das marés','Frequência maior e detecção no nível 2.',.11,{detect:true})
    ]),
  dino('farm','support','Braquiossauro','Brachiosaurus','Renda por onda','leaf',345,'long',colors('#8aa56d','#ead39b','#bd9564','#ecc079'),
    'Coleta frutos e gera ouro no fim de cada onda.',
    {range:2.55,income:80,style:'support'},[
      path('Pomar dourado','target','Aumenta o ouro colhido em cada onda.',[{income:38},{income:54},{income:76},{income:110},{income:220}],1.14),
      path('Horta comunitária','range','Produz mais frutos e dá cadência aos aliados.',[{income:22,aura:.08,auraRadius:2.8},{income:30,auraRadius:.6},{income:44,aura:.08},{income:68,auraRadius:.6},{income:110,aura:.14}]),
      path('Época fértil','bolt','Colheitas maiores e valorização da revenda.',[{income:27,resale:.05},{income:35,resale:.05},{income:53},{income:70,resale:.05},{income:135}],1.08)
    ]),
  dino('spikes','support','Espinóforo','Spinophorosaurus','Armadilhas','spark',370,'sauropod',colors('#ab8d65','#ebcc94','#6e9982','#e9a663'),
    'Espalha pilhas de espinhos na trilha para estourar os balões que passarem.',
    {range:4.15,rate:2.1,damage:1,charges:6,style:'trap'},[
      path('Armadilha reforçada','target','Espinhos mais fortes. Perfuram Liga no nível 2.',[{damage:1},{armor:true,damage:1},{damage:2},{damage:3},{damage:5}],1.12),
      path('Tapete de espinhos','range','Pilhas maiores e capazes de durar mais.',[{charges:3},{charges:3,trapLimit:2},{charges:5},{charges:7,range:.8},{charges:10,damage:2}]),
      rhythm('Reposição rápida','Prepara e distribui espinhos mais depressa.',.27,{trapLimit:2},1.1)
    ]),
  dino('beacon','support','Coritossauro','Corythosaurus','Aura de vigia','signal',220,'helmet',colors('#73aa82','#d2e0a9','#e7a563','#b5dc80'),
    'Seu chamado revela Véus e aumenta a cadência de aliados próximos.',
    {range:4.4,aura:.18,auraDetect:true,style:'support'},[
      path('Chamado de força','target','Aumenta a potência de aliados próximos.',[{auraDamage:1},{aura:.08},{auraDamage:1},{aura:.12},{auraDamage:2}],1.15),
      path('Sinal amplo','range','Amplia a cobertura e o alcance aliado.',[{range:.7},{auraRange:.45},{range:.7,auraRange:.35},{range:.65},{auraRange:.6,range:.7}]),
      path('Ritmo de batalha','bolt','Acelera ainda mais as torres próximas.',[{aura:.11},{aura:.10},{aura:.11},{aura:.11},{aura:.17,range:.5}],1.13)
    ]),
  dino('engineer','support','Paquirrino','Pachyrhinosaurus','Sentinelas','tower',445,'bosses',colors('#7195a0','#ccdbb0','#e8a86b','#70d2bd'),
    'Morde os balões e chama sentinelas jovens que também atacam por conta própria.',
    {range:4.32,rate:.87,damage:1,sentries:2,style:'bolt'},[
      path('Ninho de sentinelas','target','Mais sentinelas, com maior dano e duração.',[{sentryDamage:1},{sentries:1},{sentryDamage:2},{sentries:1},{sentryDamage:4,sentries:1}],1.18),
      path('Sobrecarga','bolt','Reforça a cadência dos aliados próximos.',[{aura:.2,auraRadius:3.4},{aura:.11},{auraRadius:.6},{aura:.14},{auraDamage:2,aura:.2}],1.2),
      path('Limpeza de pista','range','A partir do nível 2, remove o Véu dos alvos atingidos.',[{range:.55},{strip:true,detect:true},{damage:2},{pierce:1,range:.6},{damage:4,pierce:2}])
    ]),
  dino('handler','support','Ornitomimo','Ornithomimus','Companheiro','leaf',445,'ostrich',colors('#c68f69','#f1d39d','#617e84','#ec9d75'),
    'Luta ao lado de um filhote. Combine dois companheiros de mesmo terreno para fortalecer um deles.',
    {range:4.2,rate:.64,damage:3,terrain:'both',style:'companion'},[
      force('Companheiro bruto','Garras mais fortes. Perfura Liga no nível 2.',2,{armor:true},1.2),
      reach('Companheiro rastreador','Maior alcance e visão de Véus no nível 2.',{detect:true}),
      path('Bando encorajado','bolt','O companheiro ataca mais rápido e apoia aliados.',[{rate:-.08},{aura:.12,auraRadius:3.6},{rate:-.08},{auraDamage:1,rate:-.05},{damage:3,aura:.17}])
    ])
];

const skill = (name,description,cooldown,kind) => ({name,description,cooldown,kind});
function hero(id,name,species,role,icon,price,plan,palette,desc,stats,ability){
  return {...dino(id,'hero',name,species,role,icon,price,plan,palette,desc,stats,[]),hero:true,ability};
}
export const HEROES = [
  hero('lira','Lira','Guanlong','Caçadora','target',490,'royal',colors('#6aa6a2','#f4d796','#fcb05a','#77dbd3'),
    'Caçadora de crista dourada que salta sobre os balões e rompe armaduras com seu rugido.',
    {range:5.3,rate:.59,damage:2,pierce:2},
    skill('Rugido de âmbar','Solta um rugido que rompe a armadura de vários balões.',24,'amber-roar')),
  hero('brasa','Brasa','Cryolophosaurus','Fogo','spark',580,'flame',colors('#d27454','#f5cc8b','#f2a651','#df555a'),
    'Usa chamas em pulsos de curto alcance. Opala resiste à magia do fogo.',
    {range:4.2,rate:.78,damage:3,splash:1.05,style:'forge',channel:'arcane',armor:true,lob:true},
    skill('Círculo de brasas','Queima os balões próximos por vários segundos.',29,'flame')),
  hero('tambor','Tambor','Carnotaurus','Cerco','bolt',590,'bull',colors('#a96452','#edb58e','#f29b66','#b65a68'),
    'Quebra armaduras com pisadas fortes que fazem a trilha tremer.',
    {range:4.9,rate:1.13,damage:4,splash:1.35,style:'bomb',channel:'blast',armor:true,lob:true},
    skill('Tremor profundo','Provoca abalos ao redor de até seis balões na ilha.',34,'quake')),
  hero('seiva','Seiva','Nothronychus','Magia do bosque','leaf',525,'claws',colors('#74a071','#e2d8a1','#9bd389','#8fbd6e'),
    'Chama as raízes da floresta para atrasar grupos de balões.',
    {range:4.9,rate:.8,damage:1,splash:1.04,slow:.43,duration:1.8,style:'tide',channel:'arcane',armor:true,lob:true},
    skill('Raízes errantes','As raízes desaceleram e empurram os balões na ilha.',27,'roots')),
  hero('mina','Mina','Maiasaura','Intendência','coin',475,'mother',colors('#a181ae','#ecd196','#d39f78','#f0bd89'),
    'Organiza as reservas do arquipélago e entrega ouro a cada onda.',
    {range:3.1,income:65,style:'support'},
    skill('Reserva de âmbar','Gera ouro e recupera até duas vidas perdidas.',38,'stash')),
  hero('talho','Talho','Utahraptor','Duelista','feather',545,'duelist',colors('#857bab','#f1d7a9','#ffad8e','#d283ab'),
    'Usa as garras para golpear rapidamente todos os balões próximos.',
    {range:2.9,rate:.43,damage:2,style:'burst',armor:true},
    skill('Dança das garras','Executa um golpe pesado em área e ganha cadência temporária.',25,'slash')),
  hero('iris','Íris','Saurornitholestes','Vigia aérea','radar',555,'lookout',colors('#4d8baf','#c1e1d4','#eec076','#8ce1cd'),
    'Salta sobre os balões com asas abertas. A partir do nível 8, revela Véus para toda a defesa.',
    {range:5.45,rate:.55,damage:2,style:'bolt',detect:true}, 
    skill('Olhos no céu','Revela Véus à defesa por 12 segundos, antes mesmo do nível 8.',31,'vision')),
  hero('ambar','Âmbar','Oviraptor','Mercadora','coin',505,'egg',colors('#bd9255','#f4da9a','#d37172','#a5d4a2'),
    'Carrega uma bolsa de itens consumíveis, comprados com o ouro da partida.',
    {range:4.2,rate:.78,damage:2,style:'bolt'},
    skill('Bolsa de campo','Recebe um item grátis para usar na sua próxima compra.',30,'voucher'))
];

export const ALL_UNITS = [...TOWERS,...HEROES];
export const TOWER_BY_ID = Object.fromEntries(ALL_UNITS.map(unit=>{
  const category=CATEGORY_BY_ID[unit.category];
  unit.card=category.card;
  unit.color=category.color;
  return [unit.id,unit];
}));
