const lineage=(name,skin,pattern,list)=>({
  name,skin,pattern,
  stages:list.split(' ').map(pair=>{
    const [mount,shape]=pair.split(':');
    return {mount,shape};
  })
});

export const EVOLUTION_DESIGNS={
  scout:[
    lineage('Escamas de cobre','#ebb67b','#8e4d37','crown:barbs wrist:scutes spine:spine-row flank:armor tail:sting'),
    lineage('Faixas de esmeralda','#a2edf1','#247479','cheek:eye-stripe chest:belly spine:feelers crown:ruff wrist:eye-stripe'),
    lineage('Plumagem dourada','#ffce63','#9b5a2e','flank:plumes spine:spine-row tail:plumes ridge:spine-fan crest:barbs')
  ],
  loop:[
    lineage('Cristas vulcânicas','#ff8254','#a63f48','side:curved-horn spine:glow wrist:barbs tail:curved-horn crest:spikes'),
    lineage('Placas de marfim','#ffd894','#a27452','spine:curved-horn cheek:tusks ridge:horns tail:shell crown:curved-horn'),
    lineage('Espinhos rosados','#efa2be','#824967','wrist:curved-horn flank:horns spine:spine-fan crest:fan tail:horns')
  ],
  cannon:[
    lineage('Carapaça rubra','#ff9e57','#9f402e','spine:carapace flank:armor ridge:spikes tail:club crest:armor-spines'),
    lineage('Cauda de âmbar','#f4d17a','#946338','tail:club spine:throat-sac flank:carapace chest:shell ridge:armor-spines'),
    lineage('Clava coral','#ff7772','#9b4c63','side:fin spine:twin-fins wrist:scutes tail:glow flank:twin-fins')
  ],
  quills:[
    lineage('Espinhos de areia','#ffd3a0','#9c604c','ridge:spikes cheek:barbs tail:sting flank:armor spine:spine-fan'),
    lineage('Fileiras carmim','#ffb18f','#a75164','flank:spikes spine:fan ridge:ribbon-fin tail:spikes crest:fan'),
    lineage('Crista em flor','#f9d986','#7f653a','crest:tuft flank:quills tail:quills ridge:plumes spine:quills')
  ],
  frost:[
    lineage('Escamas da geleira','#b5f1ff','#486cb4','crown:scales wrist:barbs spine:scales cheek:sail crest:sail'),
    lineage('Crista de neve','#e7ffff','#7696c6','flank:scales ridge:sail tail:fan spine:fan crown:ruff'),
    lineage('Geada violeta','#d4affb','#615084','chest:spots cheek:eye-stripe spine:ruff flank:stripes crest:spots')
  ],
  glue:[
    lineage('Glândulas de musgo','#dafa70','#677d31','side:freckles chest:dew flank:stripes crown:spot spine:hump'),
    lineage('Leque dourado','#ffe380','#987235','crest:fan tail:dew flank:leaf-crest spine:hump ridge:fan'),
    lineage('Resina de âmbar','#ffa752','#a55a38','wrist:scutes spine:scale-pattern flank:stripes cheek:spot tail:scale-pattern')
  ],
  sniper:[
    lineage('Escamas de cobre','#ffc476','#765043','cheek:eye-stripe chest:bib side:fin spine:spine-fan tail:sting'),
    lineage('Crista da ravina','#c8e39a','#506b57','crest:leaf-crest cheek:brow spine:ribbon-fin flank:leaf-crest crown:feelers'),
    lineage('Faixas de lagoa','#8ce5df','#417477','chest:belly wrist:scutes flank:twin-fins side:eye-stripe ridge:feelers')
  ],
  sub:[
    lineage('Escamas marinhas','#89d5e3','#2a718e','flank:flippers spine:fin ridge:armor tail:ridge crown:sail'),
    lineage('Nadadeiras de esmeralda','#a5f9c2','#2b7e72','crown:feelers flank:eye-stripe spine:air-sacs cheek:brow tail:feelers'),
    lineage('Cauda de correnteza','#f6ce78','#9d6b55','tail:flippers flank:plumes ridge:fan spine:twin-fins crest:flippers')
  ],
  corsair:[
    lineage('Crista de areia','#f2b576','#85634a','spine:ribbon-fin flank:fin chest:shell side:twin-fins ridge:armor-spines'),
    lineage('Manchas costeiras','#b9f1ce','#3b7862','crest:luminescence spine:feelers flank:air-sacs tail:luminescence crown:ruff'),
    lineage('Cauda de maré','#76e6e8','#4276a0','flank:barbs side:twin-fins tail:flippers ridge:spine-row crest:plumes')
  ],
  wing:[
    lineage('Plumas do entardecer','#ffc16f','#9a4c4b','wings:flight-feathers crest:glow flank:fin tail:plumes ridge:carapace'),
    lineage('Asas de vigia','#b3eeec','#516da1','crown:brow wings:fan chest:spots spine:feelers tail:ribbon-fin'),
    lineage('Penacho de coral','#ff9f9b','#944f79','crest:plumes wings:flight-feathers tail:fan flank:plumes crown:tuft')
  ],
  pilot:[
    lineage('Garras de cobre','#ffca9a','#975040','wrist:claws wings:barbs flank:armor crest:barbs tail:curved-horn'),
    lineage('Faixas de altitude','#c2dcff','#6064a3','cheek:brow spine:luminescence wings:ribbon-fin crest:ruff tail:luminescence'),
    lineage('Membranas de vento','#b0f2ca','#397d71','wings:membrane tail:plumes crest:tuft flank:flippers spine:membrane')
  ],
  mortar:[
    lineage('Chifres de arenito','#ffb082','#9b5e49','crown:armor flank:carapace ridge:armor-spines tail:club spine:fin'),
    lineage('Crista dourada','#ffd879','#9a793c','spine:throat-sac cheek:eye-stripe tail:throat-sac flank:ruff crest:armor-spines'),
    lineage('Franja de granada','#ffa5b9','#95486a','side:fin spine:twin-fins flank:glow ridge:spine-fan crown:glow')
  ],
  gunner:[
    lineage('Bico de minério','#f0caa9','#795047','wrist:barbs chest:shell flank:fin spine:armor-spines crown:sting'),
    lineage('Faixas limão','#c9ed88','#526c46','cheek:eye-stripe side:twin-fins crest:feelers spine:spine-fan tail:ribbon-fin'),
    lineage('Garganta coral','#fd9f70','#9d4f49','chest:throat-sac flank:twin-fins spine:throat-sac cheek:brow ridge:twin-fins')
  ],
  prism:[
    lineage('Crista solar','#ffe28b','#a3689b','crown:sun-crest chest:scales spine:ruff flank:sun-crest crest:sun-crest'),
    lineage('Escamas espectrais','#c7b4f9','#6b55a2','cheek:eye-stripe spine:scales ridge:sail tail:spots crown:ruff'),
    lineage('Escamas de orquídea','#f8a7db','#99559e','flank:scales crest:fan spine:spots crown:scales tail:scales')
  ],
  super:[
    lineage('Crista de aurora','#ffb368','#99495b','crown:sun-crest chest:bib flank:armor tail:glow ridge:sun-crest'),
    lineage('Escamas siderais','#aabaff','#4d579d','chest:keeled-scales flank:scales wrist:scutes spine:shell crest:sail'),
    lineage('Crista de brasas','#ff777d','#a73e55','crest:glow spine:glow tail:fan flank:glow crown:sun-crest')
  ],
  hive:[
    lineage('Garras de latão','#fbd0a3','#895774','wrist:claws crest:barbs flank:curved-horn tail:ridge spine:spine-row'),
    lineage('Penas de brasa','#ff9fc1','#9c5683','crest:plumes tail:glow flank:plumes spine:glow ridge:fan'),
    lineage('Plumagem de caça','#bfa7f2','#5e548f','tail:plumes flank:ribbon-fin wrist:scutes crest:tuft spine:plumes')
  ],
  brew:[
    lineage('Escamas de seiva','#cef29b','#547856','side:freckles spine:hump cheek:spot flank:stripes crown:dew'),
    lineage('Manchas de orvalho','#f9ccef','#9f659d','chest:freckles flank:luminescence spine:luminescence crown:ruff tail:freckles'),
    lineage('Faixas de néctar','#ffd197','#9a634b','flank:scale-pattern spine:patch wrist:freckles ridge:stripes crest:spot')
  ],
  grove:[
    lineage('Espinhos de ferro','#e1b076','#786c4f','wrist:claws tail:spikes spine:shell flank:spikes crown:barbs'),
    lineage('Folhas do vendaval','#b4fac1','#448664','crest:leaf-crest flank:fan spine:leaf-crest tail:membrane crown:fan'),
    lineage('Escamas da clareira','#ffdcb0','#5b8559','chest:petals flank:rosettes spine:antlers tail:leaf-crest crest:petals')
  ],
  tide:[
    lineage('Sopro abissal','#a9e8fe','#4a6795','cheek:flippers chest:carapace spine:throat-frill tail:flippers crest:throat-frill'),
    lineage('Membrana lilás','#d3acef','#755499','crest:ruff flank:spots crown:spot tail:ruff spine:luminescence'),
    lineage('Cauda em leque','#98f0d4','#418278','tail:fan flank:flippers chest:spot ridge:fan crown:membrane')
  ],
  farm:[
    lineage('Escamas do pomar','#ffd565','#a66f3b','spine:rosettes chest:bib flank:patch ridge:rosettes crest:leaf-crest'),
    lineage('Crista de hortelã','#b7ed9b','#62824b','flank:leaf-crest spine:antlers tail:petals crown:leaf-crest ridge:antlers'),
    lineage('Rosetas de outono','#ffb89d','#a56d50','side:patch throat:petals flank:rosettes tail:patch spine:rosettes')
  ],
  spikes:[
    lineage('Escamas de pedra','#f0c99c','#90665d','tail:spikes wrist:scutes flank:keeled-scales spine:quills crest:armor-spines'),
    lineage('Espinhos de jade','#a5e1d6','#51777a','flank:quills spine:spine-fan chest:belly ridge:spikes tail:spine-fan'),
    lineage('Cauda espinhosa','#f5a7b0','#965e62','tail:throat-sac side:fin flank:throat-sac ridge:spine-fan crown:quills')
  ],
  beacon:[
    lineage('Crista do amanhecer','#ffd199','#a76e50','crest:luminescence chest:bib spine:ribbon-fin flank:armor crown:sun-crest'),
    lineage('Crista esmeralda','#aff7e4','#467f73','crown:feelers side:luminescence ridge:feelers tail:luminescence flank:ruff'),
    lineage('Garganta violeta','#e6b3ff','#755684','chest:throat-sac flank:throat-frill spine:throat-sac tail:ribbon-fin crest:throat-frill')
  ],
  engineer:[
    lineage('Escamas de barro','#f2c072','#957250','spine:patch wrist:scutes flank:twin-fins ridge:armor-spines crown:brow'),
    lineage('Escamas de turquesa','#79f1d2','#2c897d','spine:spots flank:stripes crown:feelers tail:glow ridge:spots'),
    lineage('Plumagem de pista','#b9cef5','#566f8f','cheek:brow side:throat-frill flank:carapace spine:fan tail:membrane')
  ],
  handler:[
    lineage('Garras da matilha','#efb990','#9c5d51','wrist:claws chest:keeled-scales flank:armor tail:club crest:tusks'),
    lineage('Escamas de vigia','#b6e8b1','#5d8062','cheek:brow spine:luminescence crest:plumes tail:feelers flank:leaf-crest'),
    lineage('Crista da matilha','#ffdb9e','#926650','spine:ribbon-fin chest:bib flank:antlers crest:throat-frill tail:ribbon-fin')
  ],
  lira:[
    lineage('Caçadora de âmbar','#ffd181','#b16851','wrist:scutes spine:spine-row crest:plumes flank:barbs crown:sun-crest')
  ],
  brasa:[
    lineage('Crista incandescente','#ffb572','#b6504a','crest:glow chest:spots flank:glow spine:ruff crown:glow')
  ],
  tambor:[
    lineage('Cauda da caldeira','#fac984','#a45d51','chest:throat-sac spine:carapace flank:throat-frill tail:club crown:tusks')
  ],
  seiva:[
    lineage('Crista do bosque','#bcf4ac','#537a59','crest:leaf-crest wrist:claws spine:antlers tail:petals crown:antlers')
  ],
  mina:[
    lineage('Escamas de ouro','#fbd995','#986c6c','chest:bib flank:patch crest:luminescence spine:rosettes crown:ruff')
  ],
  talho:[
    lineage('Garras de ametista','#f0b5f0','#8564a4','wrist:curved-horn crest:barbs flank:horns spine:ribbon-fin crown:tusks')
  ],
  iris:[
    lineage('Plumas celestes','#9af5e8','#407b91','crown:brow spine:feelers flank:plumes crest:ruff side:spots')
  ],
  ambar:[
    lineage('Escamas de mel','#ffd597','#ab7256','side:patch chest:scute flank:stripes spine:rosettes crown:luminescence')
  ],
};

export const EVOLUTION_PARTS={
  "barbs": "Pontas ósseas",
  "scutes": "Escamas grossas",
  "spine-row": "Fileira dorsal",
  "armor": "Couraça de escamas",
  "sting": "Espinho caudal",
  "eye-stripe": "Faixa dos olhos",
  "belly": "Mancha ventral",
  "feelers": "Filamentos",
  "ruff": "Colar de plumas",
  "plumes": "Plumas",
  "spine-fan": "Leque dorsal",
  "curved-horn": "Chifre curvo",
  "horns": "Chifres gêmeos",
  "glow": "Escamas brilhantes",
  "spikes": "Espinhos",
  "tusks": "Presas",
  "shell": "Placas da pele",
  "fan": "Leque de crista",
  "carapace": "Carapaça",
  "club": "Clava da cauda",
  "armor-spines": "Placas espinhosas",
  "throat-sac": "Bolsa da garganta",
  "fin": "Nadadeira",
  "twin-fins": "Nadadeiras duplas",
  "tuft": "Penacho",
  "quills": "Espinhos em leque",
  "scales": "Escamas em relevo",
  "sail": "Vela dorsal",
  "spots": "Manchas grandes",
  "stripes": "Listras",
  "freckles": "Sardas",
  "dew": "Gotas nas escamas",
  "spot": "Mancha",
  "hump": "Corcova",
  "leaf-crest": "Crista folhosa",
  "scale-pattern": "Padrão de escamas",
  "bib": "Mancha do peito",
  "brow": "Sobrancelha óssea",
  "ribbon-fin": "Membrana longa",
  "flippers": "Nadadeiras largas",
  "ridge": "Crista óssea",
  "air-sacs": "Bolsas laterais",
  "luminescence": "Escamas luminosas",
  "flight-feathers": "Penas de voo",
  "claws": "Garras",
  "membrane": "Membranas",
  "sun-crest": "Crista solar",
  "keeled-scales": "Escamas quilhadas",
  "patch": "Mancha de cor",
  "rosettes": "Rosetas",
  "petals": "Crista em pétalas",
  "antlers": "Chifres ramificados",
  "throat-frill": "Franja da garganta",
  "scute": "Placa central"
};
