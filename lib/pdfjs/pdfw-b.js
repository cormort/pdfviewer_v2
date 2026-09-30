k;
          case "begincodespacerange":
            parseCodespaceRange(cMap, lexer);
            break;
          case "beginbfchar":
            parseBfChar(cMap, lexer);
            break;
          case "begincidchar":
            parseCidChar(cMap, lexer);
            break;
          case "beginbfrange":
            parseBfRange(cMap, lexer);
            break;
          case "begincidrange":
            parseCidRange(cMap, lexer);
            break;
        }
      }
    } catch (ex) {
      if (ex instanceof MissingDataException) {
        throw ex;
      }
      warn("Invalid cMap data: " + ex);
      continue;
    }
  }
  if (!useCMap && embeddedUseCMap) {
    useCMap = embeddedUseCMap;
  }
  if (useCMap) {
    return extendCMap(cMap, fetchBuiltInCMap, useCMap);
  }
  return cMap;
}
async function extendCMap(cMap, fetchBuiltInCMap, useCMap) {
  cMap.useCMap = await createBuiltInCMap(useCMap, fetchBuiltInCMap);
  if (cMap.numCodespaceRanges === 0) {
    const useCodespaceRanges = cMap.useCMap.codespaceRanges;
    for (let i = 0; i < useCodespaceRanges.length; i++) {
      cMap.codespaceRanges[i] = useCodespaceRanges[i].slice();
    }
    cMap.numCodespaceRanges = cMap.useCMap.numCodespaceRanges;
  }
  cMap.useCMap.forEach(function (key, value) {
    if (!cMap.contains(key)) {
      cMap.mapOne(key, value);
    }
  });
  return cMap;
}
async function createBuiltInCMap(name, fetchBuiltInCMap) {
  if (name === "Identity-H") {
    return new IdentityCMap(false, 2);
  } else if (name === "Identity-V") {
    return new IdentityCMap(true, 2);
  }
  if (!BUILT_IN_CMAPS.includes(name)) {
    throw new Error("Unknown CMap name: " + name);
  }
  if (!fetchBuiltInCMap) {
    throw new Error("Built-in CMap parameters are not provided.");
  }
  const {
    cMapData,
    isCompressed
  } = await fetchBuiltInCMap(name);
  const cMap = new CMap(true);
  if (isCompressed) {
    return new BinaryCMapReader().process(cMapData, cMap, useCMap => extendCMap(cMap, fetchBuiltInCMap, useCMap));
  }
  const lexer = new Lexer(new Stream(cMapData));
  return parseCMap(cMap, lexer, fetchBuiltInCMap, null);
}
class CMapFactory {
  static async create({
    encoding,
    fetchBuiltInCMap,
    useCMap
  }) {
    if (encoding instanceof Name) {
      return createBuiltInCMap(encoding.name, fetchBuiltInCMap);
    } else if (encoding instanceof BaseStream) {
      const parsedCMap = await parseCMap(new CMap(), new Lexer(encoding), fetchBuiltInCMap, useCMap);
      if (parsedCMap.isIdentityCMap) {
        return createBuiltInCMap(parsedCMap.name, fetchBuiltInCMap);
      }
      return parsedCMap;
    }
    throw new Error("Encoding required.");
  }
}

;// ./src/core/encodings.js
const ExpertEncoding = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "space", "exclamsmall", "Hungarumlautsmall", "", "dollaroldstyle", "dollarsuperior", "ampersandsmall", "Acutesmall", "parenleftsuperior", "parenrightsuperior", "twodotenleader", "onedotenleader", "comma", "hyphen", "period", "fraction", "zerooldstyle", "oneoldstyle", "twooldstyle", "threeoldstyle", "fouroldstyle", "fiveoldstyle", "sixoldstyle", "sevenoldstyle", "eightoldstyle", "nineoldstyle", "colon", "semicolon", "commasuperior", "threequartersemdash", "periodsuperior", "questionsmall", "", "asuperior", "bsuperior", "centsuperior", "dsuperior", "esuperior", "", "", "", "isuperior", "", "", "lsuperior", "msuperior", "nsuperior", "osuperior", "", "", "rsuperior", "ssuperior", "tsuperior", "", "ff", "fi", "fl", "ffi", "ffl", "parenleftinferior", "", "parenrightinferior", "Circumflexsmall", "hyphensuperior", "Gravesmall", "Asmall", "Bsmall", "Csmall", "Dsmall", "Esmall", "Fsmall", "Gsmall", "Hsmall", "Ismall", "Jsmall", "Ksmall", "Lsmall", "Msmall", "Nsmall", "Osmall", "Psmall", "Qsmall", "Rsmall", "Ssmall", "Tsmall", "Usmall", "Vsmall", "Wsmall", "Xsmall", "Ysmall", "Zsmall", "colonmonetary", "onefitted", "rupiah", "Tildesmall", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "exclamdownsmall", "centoldstyle", "Lslashsmall", "", "", "Scaronsmall", "Zcaronsmall", "Dieresissmall", "Brevesmall", "Caronsmall", "", "Dotaccentsmall", "", "", "Macronsmall", "", "", "figuredash", "hypheninferior", "", "", "Ogoneksmall", "Ringsmall", "Cedillasmall", "", "", "", "onequarter", "onehalf", "threequarters", "questiondownsmall", "oneeighth", "threeeighths", "fiveeighths", "seveneighths", "onethird", "twothirds", "", "", "zerosuperior", "onesuperior", "twosuperior", "threesuperior", "foursuperior", "fivesuperior", "sixsuperior", "sevensuperior", "eightsuperior", "ninesuperior", "zeroinferior", "oneinferior", "twoinferior", "threeinferior", "fourinferior", "fiveinferior", "sixinferior", "seveninferior", "eightinferior", "nineinferior", "centinferior", "dollarinferior", "periodinferior", "commainferior", "Agravesmall", "Aacutesmall", "Acircumflexsmall", "Atildesmall", "Adieresissmall", "Aringsmall", "AEsmall", "Ccedillasmall", "Egravesmall", "Eacutesmall", "Ecircumflexsmall", "Edieresissmall", "Igravesmall", "Iacutesmall", "Icircumflexsmall", "Idieresissmall", "Ethsmall", "Ntildesmall", "Ogravesmall", "Oacutesmall", "Ocircumflexsmall", "Otildesmall", "Odieresissmall", "OEsmall", "Oslashsmall", "Ugravesmall", "Uacutesmall", "Ucircumflexsmall", "Udieresissmall", "Yacutesmall", "Thornsmall", "Ydieresissmall"];
const MacExpertEncoding = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "space", "exclamsmall", "Hungarumlautsmall", "centoldstyle", "dollaroldstyle", "dollarsuperior", "ampersandsmall", "Acutesmall", "parenleftsuperior", "parenrightsuperior", "twodotenleader", "onedotenleader", "comma", "hyphen", "period", "fraction", "zerooldstyle", "oneoldstyle", "twooldstyle", "threeoldstyle", "fouroldstyle", "fiveoldstyle", "sixoldstyle", "sevenoldstyle", "eightoldstyle", "nineoldstyle", "colon", "semicolon", "", "threequartersemdash", "", "questionsmall", "", "", "", "", "Ethsmall", "", "", "onequarter", "onehalf", "threequarters", "oneeighth", "threeeighths", "fiveeighths", "seveneighths", "onethird", "twothirds", "", "", "", "", "", "", "ff", "fi", "fl", "ffi", "ffl", "parenleftinferior", "", "parenrightinferior", "Circumflexsmall", "hypheninferior", "Gravesmall", "Asmall", "Bsmall", "Csmall", "Dsmall", "Esmall", "Fsmall", "Gsmall", "Hsmall", "Ismall", "Jsmall", "Ksmall", "Lsmall", "Msmall", "Nsmall", "Osmall", "Psmall", "Qsmall", "Rsmall", "Ssmall", "Tsmall", "Usmall", "Vsmall", "Wsmall", "Xsmall", "Ysmall", "Zsmall", "colonmonetary", "onefitted", "rupiah", "Tildesmall", "", "", "asuperior", "centsuperior", "", "", "", "", "Aacutesmall", "Agravesmall", "Acircumflexsmall", "Adieresissmall", "Atildesmall", "Aringsmall", "Ccedillasmall", "Eacutesmall", "Egravesmall", "Ecircumflexsmall", "Edieresissmall", "Iacutesmall", "Igravesmall", "Icircumflexsmall", "Idieresissmall", "Ntildesmall", "Oacutesmall", "Ogravesmall", "Ocircumflexsmall", "Odieresissmall", "Otildesmall", "Uacutesmall", "Ugravesmall", "Ucircumflexsmall", "Udieresissmall", "", "eightsuperior", "fourinferior", "threeinferior", "sixinferior", "eightinferior", "seveninferior", "Scaronsmall", "", "centinferior", "twoinferior", "", "Dieresissmall", "", "Caronsmall", "osuperior", "fiveinferior", "", "commainferior", "periodinferior", "Yacutesmall", "", "dollarinferior", "", "", "Thornsmall", "", "nineinferior", "zeroinferior", "Zcaronsmall", "AEsmall", "Oslashsmall", "questiondownsmall", "oneinferior", "Lslashsmall", "", "", "", "", "", "", "Cedillasmall", "", "", "", "", "", "OEsmall", "figuredash", "hyphensuperior", "", "", "", "", "exclamdownsmall", "", "Ydieresissmall", "", "onesuperior", "twosuperior", "threesuperior", "foursuperior", "fivesuperior", "sixsuperior", "sevensuperior", "ninesuperior", "zerosuperior", "", "esuperior", "rsuperior", "tsuperior", "", "", "isuperior", "ssuperior", "dsuperior", "", "", "", "", "", "lsuperior", "Ogoneksmall", "Brevesmall", "Macronsmall", "bsuperior", "nsuperior", "msuperior", "commasuperior", "periodsuperior", "Dotaccentsmall", "Ringsmall", "", "", "", ""];
const MacRomanEncoding = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "space", "exclam", "quotedbl", "numbersign", "dollar", "percent", "ampersand", "quotesingle", "parenleft", "parenright", "asterisk", "plus", "comma", "hyphen", "period", "slash", "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "colon", "semicolon", "less", "equal", "greater", "question", "at", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "bracketleft", "backslash", "bracketright", "asciicircum", "underscore", "grave", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "braceleft", "bar", "braceright", "asciitilde", "", "Adieresis", "Aring", "Ccedilla", "Eacute", "Ntilde", "Odieresis", "Udieresis", "aacute", "agrave", "acircumflex", "adieresis", "atilde", "aring", "ccedilla", "eacute", "egrave", "ecircumflex", "edieresis", "iacute", "igrave", "icircumflex", "idieresis", "ntilde", "oacute", "ograve", "ocircumflex", "odieresis", "otilde", "uacute", "ugrave", "ucircumflex", "udieresis", "dagger", "degree", "cent", "sterling", "section", "bullet", "paragraph", "germandbls", "registered", "copyright", "trademark", "acute", "dieresis", "notequal", "AE", "Oslash", "infinity", "plusminus", "lessequal", "greaterequal", "yen", "mu", "partialdiff", "summation", "product", "pi", "integral", "ordfeminine", "ordmasculine", "Omega", "ae", "oslash", "questiondown", "exclamdown", "logicalnot", "radical", "florin", "approxequal", "Delta", "guillemotleft", "guillemotright", "ellipsis", "space", "Agrave", "Atilde", "Otilde", "OE", "oe", "endash", "emdash", "quotedblleft", "quotedblright", "quoteleft", "quoteright", "divide", "lozenge", "ydieresis", "Ydieresis", "fraction", "currency", "guilsinglleft", "guilsinglright", "fi", "fl", "daggerdbl", "periodcentered", "quotesinglbase", "quotedblbase", "perthousand", "Acircumflex", "Ecircumflex", "Aacute", "Edieresis", "Egrave", "Iacute", "Icircumflex", "Idieresis", "Igrave", "Oacute", "Ocircumflex", "apple", "Ograve", "Uacute", "Ucircumflex", "Ugrave", "dotlessi", "circumflex", "tilde", "macron", "breve", "dotaccent", "ring", "cedilla", "hungarumlaut", "ogonek", "caron"];
const StandardEncoding = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "space", "exclam", "quotedbl", "numbersign", "dollar", "percent", "ampersand", "quoteright", "parenleft", "parenright", "asterisk", "plus", "comma", "hyphen", "period", "slash", "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "colon", "semicolon", "less", "equal", "greater", "question", "at", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "bracketleft", "backslash", "bracketright", "asciicircum", "underscore", "quoteleft", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "braceleft", "bar", "braceright", "asciitilde", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "exclamdown", "cent", "sterling", "fraction", "yen", "florin", "section", "currency", "quotesingle", "quotedblleft", "guillemotleft", "guilsinglleft", "guilsinglright", "fi", "fl", "", "endash", "dagger", "daggerdbl", "periodcentered", "", "paragraph", "bullet", "quotesinglbase", "quotedblbase", "quotedblright", "guillemotright", "ellipsis", "perthousand", "", "questiondown", "", "grave", "acute", "circumflex", "tilde", "macron", "breve", "dotaccent", "dieresis", "", "ring", "cedilla", "", "hungarumlaut", "ogonek", "caron", "emdash", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "AE", "", "ordfeminine", "", "", "", "", "Lslash", "Oslash", "OE", "ordmasculine", "", "", "", "", "", "ae", "", "", "", "dotlessi", "", "", "lslash", "oslash", "oe", "germandbls", "", "", "", ""];
const WinAnsiEncoding = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "space", "exclam", "quotedbl", "numbersign", "dollar", "percent", "ampersand", "quotesingle", "parenleft", "parenright", "asterisk", "plus", "comma", "hyphen", "period", "slash", "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "colon", "semicolon", "less", "equal", "greater", "question", "at", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "bracketleft", "backslash", "bracketright", "asciicircum", "underscore", "grave", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "braceleft", "bar", "braceright", "asciitilde", "bullet", "Euro", "bullet", "quotesinglbase", "florin", "quotedblbase", "ellipsis", "dagger", "daggerdbl", "circumflex", "perthousand", "Scaron", "guilsinglleft", "OE", "bullet", "Zcaron", "bullet", "bullet", "quoteleft", "quoteright", "quotedblleft", "quotedblright", "bullet", "endash", "emdash", "tilde", "trademark", "scaron", "guilsinglright", "oe", "bullet", "zcaron", "Ydieresis", "space", "exclamdown", "cent", "sterling", "currency", "yen", "brokenbar", "section", "dieresis", "copyright", "ordfeminine", "guillemotleft", "logicalnot", "hyphen", "registered", "macron", "degree", "plusminus", "twosuperior", "threesuperior", "acute", "mu", "paragraph", "periodcentered", "cedilla", "onesuperior", "ordmasculine", "guillemotright", "onequarter", "onehalf", "threequarters", "questiondown", "Agrave", "Aacute", "Acircumflex", "Atilde", "Adieresis", "Aring", "AE", "Ccedilla", "Egrave", "Eacute", "Ecircumflex", "Edieresis", "Igrave", "Iacute", "Icircumflex", "Idieresis", "Eth", "Ntilde", "Ograve", "Oacute", "Ocircumflex", "Otilde", "Odieresis", "multiply", "Oslash", "Ugrave", "Uacute", "Ucircumflex", "Udieresis", "Yacute", "Thorn", "germandbls", "agrave", "aacute", "acircumflex", "atilde", "adieresis", "aring", "ae", "ccedilla", "egrave", "eacute", "ecircumflex", "edieresis", "igrave", "iacute", "icircumflex", "idieresis", "eth", "ntilde", "ograve", "oacute", "ocircumflex", "otilde", "odieresis", "divide", "oslash", "ugrave", "uacute", "ucircumflex", "udieresis", "yacute", "thorn", "ydieresis"];
const SymbolSetEncoding = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "space", "exclam", "universal", "numbersign", "existential", "percent", "ampersand", "suchthat", "parenleft", "parenright", "asteriskmath", "plus", "comma", "minus", "period", "slash", "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "colon", "semicolon", "less", "equal", "greater", "question", "congruent", "Alpha", "Beta", "Chi", "Delta", "Epsilon", "Phi", "Gamma", "Eta", "Iota", "theta1", "Kappa", "Lambda", "Mu", "Nu", "Omicron", "Pi", "Theta", "Rho", "Sigma", "Tau", "Upsilon", "sigma1", "Omega", "Xi", "Psi", "Zeta", "bracketleft", "therefore", "bracketright", "perpendicular", "underscore", "radicalex", "alpha", "beta", "chi", "delta", "epsilon", "phi", "gamma", "eta", "iota", "phi1", "kappa", "lambda", "mu", "nu", "omicron", "pi", "theta", "rho", "sigma", "tau", "upsilon", "omega1", "omega", "xi", "psi", "zeta", "braceleft", "bar", "braceright", "similar", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "Euro", "Upsilon1", "minute", "lessequal", "fraction", "infinity", "florin", "club", "diamond", "heart", "spade", "arrowboth", "arrowleft", "arrowup", "arrowright", "arrowdown", "degree", "plusminus", "second", "greaterequal", "multiply", "proportional", "partialdiff", "bullet", "divide", "notequal", "equivalence", "approxequal", "ellipsis", "arrowvertex", "arrowhorizex", "carriagereturn", "aleph", "Ifraktur", "Rfraktur", "weierstrass", "circlemultiply", "circleplus", "emptyset", "intersection", "union", "propersuperset", "reflexsuperset", "notsubset", "propersubset", "reflexsubset", "element", "notelement", "angle", "gradient", "registerserif", "copyrightserif", "trademarkserif", "product", "radical", "dotmath", "logicalnot", "logicaland", "logicalor", "arrowdblboth", "arrowdblleft", "arrowdblup", "arrowdblright", "arrowdbldown", "lozenge", "angleleft", "registersans", "copyrightsans", "trademarksans", "summation", "parenlefttp", "parenleftex", "parenleftbt", "bracketlefttp", "bracketleftex", "bracketleftbt", "bracelefttp", "braceleftmid", "braceleftbt", "braceex", "", "angleright", "integral", "integraltp", "integralex", "integralbt", "parenrighttp", "parenrightex", "parenrightbt", "bracketrighttp", "bracketrightex", "bracketrightbt", "bracerighttp", "bracerightmid", "bracerightbt", ""];
const ZapfDingbatsEncoding = ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "space", "a1", "a2", "a202", "a3", "a4", "a5", "a119", "a118", "a117", "a11", "a12", "a13", "a14", "a15", "a16", "a105", "a17", "a18", "a19", "a20", "a21", "a22", "a23", "a24", "a25", "a26", "a27", "a28", "a6", "a7", "a8", "a9", "a10", "a29", "a30", "a31", "a32", "a33", "a34", "a35", "a36", "a37", "a38", "a39", "a40", "a41", "a42", "a43", "a44", "a45", "a46", "a47", "a48", "a49", "a50", "a51", "a52", "a53", "a54", "a55", "a56", "a57", "a58", "a59", "a60", "a61", "a62", "a63", "a64", "a65", "a66", "a67", "a68", "a69", "a70", "a71", "a72", "a73", "a74", "a203", "a75", "a204", "a76", "a77", "a78", "a79", "a81", "a82", "a83", "a84", "a97", "a98", "a99", "a100", "", "a89", "a90", "a93", "a94", "a91", "a92", "a205", "a85", "a206", "a86", "a87", "a88", "a95", "a96", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "a101", "a102", "a103", "a104", "a106", "a107", "a108", "a112", "a111", "a110", "a109", "a120", "a121", "a122", "a123", "a124", "a125", "a126", "a127", "a128", "a129", "a130", "a131", "a132", "a133", "a134", "a135", "a136", "a137", "a138", "a139", "a140", "a141", "a142", "a143", "a144", "a145", "a146", "a147", "a148", "a149", "a150", "a151", "a152", "a153", "a154", "a155", "a156", "a157", "a158", "a159", "a160", "a161", "a163", "a164", "a196", "a165", "a192", "a166", "a167", "a168", "a169", "a170", "a171", "a172", "a173", "a162", "a174", "a175", "a176", "a177", "a178", "a179", "a193", "a180", "a199", "a181", "a200", "a182", "", "a201", "a183", "a184", "a197", "a185", "a194", "a198", "a186", "a195", "a187", "a188", "a189", "a190", "a191", ""];
function getEncoding(encodingName) {
  switch (encodingName) {
    case "WinAnsiEncoding":
      return WinAnsiEncoding;
    case "StandardEncoding":
      return StandardEncoding;
    case "MacRomanEncoding":
      return MacRomanEncoding;
    case "SymbolSetEncoding":
      return SymbolSetEncoding;
    case "ZapfDingbatsEncoding":
      return ZapfDingbatsEncoding;
    case "ExpertEncoding":
      return ExpertEncoding;
    case "MacExpertEncoding":
      return MacExpertEncoding;
    default:
      return null;
  }
}

;// ./src/core/glyphlist.js

const getGlyphsUnicode = getLookupTableFactory(function (t) {
  t.A = 0x0041;
  t.AE = 0x00c6;
  t.AEacute = 0x01fc;
  t.AEmacron = 0x01e2;
  t.AEsmall = 0xf7e6;
  t.Aacute = 0x00c1;
  t.Aacutesmall = 0xf7e1;
  t.Abreve = 0x0102;
  t.Abreveacute = 0x1eae;
  t.Abrevecyrillic = 0x04d0;
  t.Abrevedotbelow = 0x1eb6;
  t.Abrevegrave = 0x1eb0;
  t.Abrevehookabove = 0x1eb2;
  t.Abrevetilde = 0x1eb4;
  t.Acaron = 0x01cd;
  t.Acircle = 0x24b6;
  t.Acircumflex = 0x00c2;
  t.Acircumflexacute = 0x1ea4;
  t.Acircumflexdotbelow = 0x1eac;
  t.Acircumflexgrave = 0x1ea6;
  t.Acircumflexhookabove = 0x1ea8;
  t.Acircumflexsmall = 0xf7e2;
  t.Acircumflextilde = 0x1eaa;
  t.Acute = 0xf6c9;
  t.Acutesmall = 0xf7b4;
  t.Acyrillic = 0x0410;
  t.Adblgrave = 0x0200;
  t.Adieresis = 0x00c4;
  t.Adieresiscyrillic = 0x04d2;
  t.Adieresismacron = 0x01de;
  t.Adieresissmall = 0xf7e4;
  t.Adotbelow = 0x1ea0;
  t.Adotmacron = 0x01e0;
  t.Agrave = 0x00c0;
  t.Agravesmall = 0xf7e0;
  t.Ahookabove = 0x1ea2;
  t.Aiecyrillic = 0x04d4;
  t.Ainvertedbreve = 0x0202;
  t.Alpha = 0x0391;
  t.Alphatonos = 0x0386;
  t.Amacron = 0x0100;
  t.Amonospace = 0xff21;
  t.Aogonek = 0x0104;
  t.Aring = 0x00c5;
  t.Aringacute = 0x01fa;
  t.Aringbelow = 0x1e00;
  t.Aringsmall = 0xf7e5;
  t.Asmall = 0xf761;
  t.Atilde = 0x00c3;
  t.Atildesmall = 0xf7e3;
  t.Aybarmenian = 0x0531;
  t.B = 0x0042;
  t.Bcircle = 0x24b7;
  t.Bdotaccent = 0x1e02;
  t.Bdotbelow = 0x1e04;
  t.Becyrillic = 0x0411;
  t.Benarmenian = 0x0532;
  t.Beta = 0x0392;
  t.Bhook = 0x0181;
  t.Blinebelow = 0x1e06;
  t.Bmonospace = 0xff22;
  t.Brevesmall = 0xf6f4;
  t.Bsmall = 0xf762;
  t.Btopbar = 0x0182;
  t.C = 0x0043;
  t.Caarmenian = 0x053e;
  t.Cacute = 0x0106;
  t.Caron = 0xf6ca;
  t.Caronsmall = 0xf6f5;
  t.Ccaron = 0x010c;
  t.Ccedilla = 0x00c7;
  t.Ccedillaacute = 0x1e08;
  t.Ccedillasmall = 0xf7e7;
  t.Ccircle = 0x24b8;
  t.Ccircumflex = 0x0108;
  t.Cdot = 0x010a;
  t.Cdotaccent = 0x010a;
  t.Cedillasmall = 0xf7b8;
  t.Chaarmenian = 0x0549;
  t.Cheabkhasiancyrillic = 0x04bc;
  t.Checyrillic = 0x0427;
  t.Chedescenderabkhasiancyrillic = 0x04be;
  t.Chedescendercyrillic = 0x04b6;
  t.Chedieresiscyrillic = 0x04f4;
  t.Cheharmenian = 0x0543;
  t.Chekhakassiancyrillic = 0x04cb;
  t.Cheverticalstrokecyrillic = 0x04b8;
  t.Chi = 0x03a7;
  t.Chook = 0x0187;
  t.Circumflexsmall = 0xf6f6;
  t.Cmonospace = 0xff23;
  t.Coarmenian = 0x0551;
  t.Csmall = 0xf763;
  t.D = 0x0044;
  t.DZ = 0x01f1;
  t.DZcaron = 0x01c4;
  t.Daarmenian = 0x0534;
  t.Dafrican = 0x0189;
  t.Dcaron = 0x010e;
  t.Dcedilla = 0x1e10;
  t.Dcircle = 0x24b9;
  t.Dcircumflexbelow = 0x1e12;
  t.Dcroat = 0x0110;
  t.Ddotaccent = 0x1e0a;
  t.Ddotbelow = 0x1e0c;
  t.Decyrillic = 0x0414;
  t.Deicoptic = 0x03ee;
  t.Delta = 0x2206;
  t.Deltagreek = 0x0394;
  t.Dhook = 0x018a;
  t.Dieresis = 0xf6cb;
  t.DieresisAcute = 0xf6cc;
  t.DieresisGrave = 0xf6cd;
  t.Dieresissmall = 0xf7a8;
  t.Digammagreek = 0x03dc;
  t.Djecyrillic = 0x0402;
  t.Dlinebelow = 0x1e0e;
  t.Dmonospace = 0xff24;
  t.Dotaccentsmall = 0xf6f7;
  t.Dslash = 0x0110;
  t.Dsmall = 0xf764;
  t.Dtopbar = 0x018b;
  t.Dz = 0x01f2;
  t.Dzcaron = 0x01c5;
  t.Dzeabkhasiancyrillic = 0x04e0;
  t.Dzecyrillic = 0x0405;
  t.Dzhecyrillic = 0x040f;
  t.E = 0x0045;
  t.Eacute = 0x00c9;
  t.Eacutesmall = 0xf7e9;
  t.Ebreve = 0x0114;
  t.Ecaron = 0x011a;
  t.Ecedillabreve = 0x1e1c;
  t.Echarmenian = 0x0535;
  t.Ecircle = 0x24ba;
  t.Ecircumflex = 0x00ca;
  t.Ecircumflexacute = 0x1ebe;
  t.Ecircumflexbelow = 0x1e18;
  t.Ecircumflexdotbelow = 0x1ec6;
  t.Ecircumflexgrave = 0x1ec0;
  t.Ecircumflexhookabove = 0x1ec2;
  t.Ecircumflexsmall = 0xf7ea;
  t.Ecircumflextilde = 0x1ec4;
  t.Ecyrillic = 0x0404;
  t.Edblgrave = 0x0204;
  t.Edieresis = 0x00cb;
  t.Edieresissmall = 0xf7eb;
  t.Edot = 0x0116;
  t.Edotaccent = 0x0116;
  t.Edotbelow = 0x1eb8;
  t.Efcyrillic = 0x0424;
  t.Egrave = 0x00c8;
  t.Egravesmall = 0xf7e8;
  t.Eharmenian = 0x0537;
  t.Ehookabove = 0x1eba;
  t.Eightroman = 0x2167;
  t.Einvertedbreve = 0x0206;
  t.Eiotifiedcyrillic = 0x0464;
  t.Elcyrillic = 0x041b;
  t.Elevenroman = 0x216a;
  t.Emacron = 0x0112;
  t.Emacronacute = 0x1e16;
  t.Emacrongrave = 0x1e14;
  t.Emcyrillic = 0x041c;
  t.Emonospace = 0xff25;
  t.Encyrillic = 0x041d;
  t.Endescendercyrillic = 0x04a2;
  t.Eng = 0x014a;
  t.Enghecyrillic = 0x04a4;
  t.Enhookcyrillic = 0x04c7;
  t.Eogonek = 0x0118;
  t.Eopen = 0x0190;
  t.Epsilon = 0x0395;
  t.Epsilontonos = 0x0388;
  t.Ercyrillic = 0x0420;
  t.Ereversed = 0x018e;
  t.Ereversedcyrillic = 0x042d;
  t.Escyrillic = 0x0421;
  t.Esdescendercyrillic = 0x04aa;
  t.Esh = 0x01a9;
  t.Esmall = 0xf765;
  t.Eta = 0x0397;
  t.Etarmenian = 0x0538;
  t.Etatonos = 0x0389;
  t.Eth = 0x00d0;
  t.Ethsmall = 0xf7f0;
  t.Etilde = 0x1ebc;
  t.Etildebelow = 0x1e1a;
  t.Euro = 0x20ac;
  t.Ezh = 0x01b7;
  t.Ezhcaron = 0x01ee;
  t.Ezhreversed = 0x01b8;
  t.F = 0x0046;
  t.Fcircle = 0x24bb;
  t.Fdotaccent = 0x1e1e;
  t.Feharmenian = 0x0556;
  t.Feicoptic = 0x03e4;
  t.Fhook = 0x0191;
  t.Fitacyrillic = 0x0472;
  t.Fiveroman = 0x2164;
  t.Fmonospace = 0xff26;
  t.Fourroman = 0x2163;
  t.Fsmall = 0xf766;
  t.G = 0x0047;
  t.GBsquare = 0x3387;
  t.Gacute = 0x01f4;
  t.Gamma = 0x0393;
  t.Gammaafrican = 0x0194;
  t.Gangiacoptic = 0x03ea;
  t.Gbreve = 0x011e;
  t.Gcaron = 0x01e6;
  t.Gcedilla = 0x0122;
  t.Gcircle = 0x24bc;
  t.Gcircumflex = 0x011c;
  t.Gcommaaccent = 0x0122;
  t.Gdot = 0x0120;
  t.Gdotaccent = 0x0120;
  t.Gecyrillic = 0x0413;
  t.Ghadarmenian = 0x0542;
  t.Ghemiddlehookcyrillic = 0x0494;
  t.Ghestrokecyrillic = 0x0492;
  t.Gheupturncyrillic = 0x0490;
  t.Ghook = 0x0193;
  t.Gimarmenian = 0x0533;
  t.Gjecyrillic = 0x0403;
  t.Gmacron = 0x1e20;
  t.Gmonospace = 0xff27;
  t.Grave = 0xf6ce;
  t.Gravesmall = 0xf760;
  t.Gsmall = 0xf767;
  t.Gsmallhook = 0x029b;
  t.Gstroke = 0x01e4;
  t.H = 0x0048;
  t.H18533 = 0x25cf;
  t.H18543 = 0x25aa;
  t.H18551 = 0x25ab;
  t.H22073 = 0x25a1;
  t.HPsquare = 0x33cb;
  t.Haabkhasiancyrillic = 0x04a8;
  t.Hadescendercyrillic = 0x04b2;
  t.Hardsigncyrillic = 0x042a;
  t.Hbar = 0x0126;
  t.Hbrevebelow = 0x1e2a;
  t.Hcedilla = 0x1e28;
  t.Hcircle = 0x24bd;
  t.Hcircumflex = 0x0124;
  t.Hdieresis = 0x1e26;
  t.Hdotaccent = 0x1e22;
  t.Hdotbelow = 0x1e24;
  t.Hmonospace = 0xff28;
  t.Hoarmenian = 0x0540;
  t.Horicoptic = 0x03e8;
  t.Hsmall = 0xf768;
  t.Hungarumlaut = 0xf6cf;
  t.Hungarumlautsmall = 0xf6f8;
  t.Hzsquare = 0x3390;
  t.I = 0x0049;
  t.IAcyrillic = 0x042f;
  t.IJ = 0x0132;
  t.IUcyrillic = 0x042e;
  t.Iacute = 0x00cd;
  t.Iacutesmall = 0xf7ed;
  t.Ibreve = 0x012c;
  t.Icaron = 0x01cf;
  t.Icircle = 0x24be;
  t.Icircumflex = 0x00ce;
  t.Icircumflexsmall = 0xf7ee;
  t.Icyrillic = 0x0406;
  t.Idblgrave = 0x0208;
  t.Idieresis = 0x00cf;
  t.Idieresisacute = 0x1e2e;
  t.Idieresiscyrillic = 0x04e4;
  t.Idieresissmall = 0xf7ef;
  t.Idot = 0x0130;
  t.Idotaccent = 0x0130;
  t.Idotbelow = 0x1eca;
  t.Iebrevecyrillic = 0x04d6;
  t.Iecyrillic = 0x0415;
  t.Ifraktur = 0x2111;
  t.Igrave = 0x00cc;
  t.Igravesmall = 0xf7ec;
  t.Ihookabove = 0x1ec8;
  t.Iicyrillic = 0x0418;
  t.Iinvertedbreve = 0x020a;
  t.Iishortcyrillic = 0x0419;
  t.Imacron = 0x012a;
  t.Imacroncyrillic = 0x04e2;
  t.Imonospace = 0xff29;
  t.Iniarmenian = 0x053b;
  t.Iocyrillic = 0x0401;
  t.Iogonek = 0x012e;
  t.Iota = 0x0399;
  t.Iotaafrican = 0x0196;
  t.Iotadieresis = 0x03aa;
  t.Iotatonos = 0x038a;
  t.Ismall = 0xf769;
  t.Istroke = 0x0197;
  t.Itilde = 0x0128;
  t.Itildebelow = 0x1e2c;
  t.Izhitsacyrillic = 0x0474;
  t.Izhitsadblgravecyrillic = 0x0476;
  t.J = 0x004a;
  t.Jaarmenian = 0x0541;
  t.Jcircle = 0x24bf;
  t.Jcircumflex = 0x0134;
  t.Jecyrillic = 0x0408;
  t.Jheharmenian = 0x054b;
  t.Jmonospace = 0xff2a;
  t.Jsmall = 0xf76a;
  t.K = 0x004b;
  t.KBsquare = 0x3385;
  t.KKsquare = 0x33cd;
  t.Kabashkircyrillic = 0x04a0;
  t.Kacute = 0x1e30;
  t.Kacyrillic = 0x041a;
  t.Kadescendercyrillic = 0x049a;
  t.Kahookcyrillic = 0x04c3;
  t.Kappa = 0x039a;
  t.Kastrokecyrillic = 0x049e;
  t.Kaverticalstrokecyrillic = 0x049c;
  t.Kcaron = 0x01e8;
  t.Kcedilla = 0x0136;
  t.Kcircle = 0x24c0;
  t.Kcommaaccent = 0x0136;
  t.Kdotbelow = 0x1e32;
  t.Keharmenian = 0x0554;
  t.Kenarmenian = 0x053f;
  t.Khacyrillic = 0x0425;
  t.Kheicoptic = 0x03e6;
  t.Khook = 0x0198;
  t.Kjecyrillic = 0x040c;
  t.Klinebelow = 0x1e34;
  t.Kmonospace = 0xff2b;
  t.Koppacyrillic = 0x0480;
  t.Koppagreek = 0x03de;
  t.Ksicyrillic = 0x046e;
  t.Ksmall = 0xf76b;
  t.L = 0x004c;
  t.LJ = 0x01c7;
  t.LL = 0xf6bf;
  t.Lacute = 0x0139;
  t.Lambda = 0x039b;
  t.Lcaron = 0x013d;
  t.Lcedilla = 0x013b;
  t.Lcircle = 0x24c1;
  t.Lcircumflexbelow = 0x1e3c;
  t.Lcommaaccent = 0x013b;
  t.Ldot = 0x013f;
  t.Ldotaccent = 0x013f;
  t.Ldotbelow = 0x1e36;
  t.Ldotbelowmacron = 0x1e38;
  t.Liwnarmenian = 0x053c;
  t.Lj = 0x01c8;
  t.Ljecyrillic = 0x0409;
  t.Llinebelow = 0x1e3a;
  t.Lmonospace = 0xff2c;
  t.Lslash = 0x0141;
  t.Lslashsmall = 0xf6f9;
  t.Lsmall = 0xf76c;
  t.M = 0x004d;
  t.MBsquare = 0x3386;
  t.Macron = 0xf6d0;
  t.Macronsmall = 0xf7af;
  t.Macute = 0x1e3e;
  t.Mcircle = 0x24c2;
  t.Mdotaccent = 0x1e40;
  t.Mdotbelow = 0x1e42;
  t.Menarmenian = 0x0544;
  t.Mmonospace = 0xff2d;
  t.Msmall = 0xf76d;
  t.Mturned = 0x019c;
  t.Mu = 0x039c;
  t.N = 0x004e;
  t.NJ = 0x01ca;
  t.Nacute = 0x0143;
  t.Ncaron = 0x0147;
  t.Ncedilla = 0x0145;
  t.Ncircle = 0x24c3;
  t.Ncircumflexbelow = 0x1e4a;
  t.Ncommaaccent = 0x0145;
  t.Ndotaccent = 0x1e44;
  t.Ndotbelow = 0x1e46;
  t.Nhookleft = 0x019d;
  t.Nineroman = 0x2168;
  t.Nj = 0x01cb;
  t.Njecyrillic = 0x040a;
  t.Nlinebelow = 0x1e48;
  t.Nmonospace = 0xff2e;
  t.Nowarmenian = 0x0546;
  t.Nsmall = 0xf76e;
  t.Ntilde = 0x00d1;
  t.Ntildesmall = 0xf7f1;
  t.Nu = 0x039d;
  t.O = 0x004f;
  t.OE = 0x0152;
  t.OEsmall = 0xf6fa;
  t.Oacute = 0x00d3;
  t.Oacutesmall = 0xf7f3;
  t.Obarredcyrillic = 0x04e8;
  t.Obarreddieresiscyrillic = 0x04ea;
  t.Obreve = 0x014e;
  t.Ocaron = 0x01d1;
  t.Ocenteredtilde = 0x019f;
  t.Ocircle = 0x24c4;
  t.Ocircumflex = 0x00d4;
  t.Ocircumflexacute = 0x1ed0;
  t.Ocircumflexdotbelow = 0x1ed8;
  t.Ocircumflexgrave = 0x1ed2;
  t.Ocircumflexhookabove = 0x1ed4;
  t.Ocircumflexsmall = 0xf7f4;
  t.Ocircumflextilde = 0x1ed6;
  t.Ocyrillic = 0x041e;
  t.Odblacute = 0x0150;
  t.Odblgrave = 0x020c;
  t.Odieresis = 0x00d6;
  t.Odieresiscyrillic = 0x04e6;
  t.Odieresissmall = 0xf7f6;
  t.Odotbelow = 0x1ecc;
  t.Ogoneksmall = 0xf6fb;
  t.Ograve = 0x00d2;
  t.Ogravesmall = 0xf7f2;
  t.Oharmenian = 0x0555;
  t.Ohm = 0x2126;
  t.Ohookabove = 0x1ece;
  t.Ohorn = 0x01a0;
  t.Ohornacute = 0x1eda;
  t.Ohorndotbelow = 0x1ee2;
  t.Ohorngrave = 0x1edc;
  t.Ohornhookabove = 0x1ede;
  t.Ohorntilde = 0x1ee0;
  t.Ohungarumlaut = 0x0150;
  t.Oi = 0x01a2;
  t.Oinvertedbreve = 0x020e;
  t.Omacron = 0x014c;
  t.Omacronacute = 0x1e52;
  t.Omacrongrave = 0x1e50;
  t.Omega = 0x2126;
  t.Omegacyrillic = 0x0460;
  t.Omegagreek = 0x03a9;
  t.Omegaroundcyrillic = 0x047a;
  t.Omegatitlocyrillic = 0x047c;
  t.Omegatonos = 0x038f;
  t.Omicron = 0x039f;
  t.Omicrontonos = 0x038c;
  t.Omonospace = 0xff2f;
  t.Oneroman = 0x2160;
  t.Oogonek = 0x01ea;
  t.Oogonekmacron = 0x01ec;
  t.Oopen = 0x0186;
  t.Oslash = 0x00d8;
  t.Oslashacute = 0x01fe;
  t.Oslashsmall = 0xf7f8;
  t.Osmall = 0xf76f;
  t.Ostrokeacute = 0x01fe;
  t.Otcyrillic = 0x047e;
  t.Otilde = 0x00d5;
  t.Otildeacute = 0x1e4c;
  t.Otildedieresis = 0x1e4e;
  t.Otildesmall = 0xf7f5;
  t.P = 0x0050;
  t.Pacute = 0x1e54;
  t.Pcircle = 0x24c5;
  t.Pdotaccent = 0x1e56;
  t.Pecyrillic = 0x041f;
  t.Peharmenian = 0x054a;
  t.Pemiddlehookcyrillic = 0x04a6;
  t.Phi = 0x03a6;
  t.Phook = 0x01a4;
  t.Pi = 0x03a0;
  t.Piwrarmenian = 0x0553;
  t.Pmonospace = 0xff30;
  t.Psi = 0x03a8;
  t.Psicyrillic = 0x0470;
  t.Psmall = 0xf770;
  t.Q = 0x0051;
  t.Qcircle = 0x24c6;
  t.Qmonospace = 0xff31;
  t.Qsmall = 0xf771;
  t.R = 0x0052;
  t.Raarmenian = 0x054c;
  t.Racute = 0x0154;
  t.Rcaron = 0x0158;
  t.Rcedilla = 0x0156;
  t.Rcircle = 0x24c7;
  t.Rcommaaccent = 0x0156;
  t.Rdblgrave = 0x0210;
  t.Rdotaccent = 0x1e58;
  t.Rdotbelow = 0x1e5a;
  t.Rdotbelowmacron = 0x1e5c;
  t.Reharmenian = 0x0550;
  t.Rfraktur = 0x211c;
  t.Rho = 0x03a1;
  t.Ringsmall = 0xf6fc;
  t.Rinvertedbreve = 0x0212;
  t.Rlinebelow = 0x1e5e;
  t.Rmonospace = 0xff32;
  t.Rsmall = 0xf772;
  t.Rsmallinverted = 0x0281;
  t.Rsmallinvertedsuperior = 0x02b6;
  t.S = 0x0053;
  t.SF010000 = 0x250c;
  t.SF020000 = 0x2514;
  t.SF030000 = 0x2510;
  t.SF040000 = 0x2518;
  t.SF050000 = 0x253c;
  t.SF060000 = 0x252c;
  t.SF070000 = 0x2534;
  t.SF080000 = 0x251c;
  t.SF090000 = 0x2524;
  t.SF100000 = 0x2500;
  t.SF110000 = 0x2502;
  t.SF190000 = 0x2561;
  t.SF200000 = 0x2562;
  t.SF210000 = 0x2556;
  t.SF220000 = 0x2555;
  t.SF230000 = 0x2563;
  t.SF240000 = 0x2551;
  t.SF250000 = 0x2557;
  t.SF260000 = 0x255d;
  t.SF270000 = 0x255c;
  t.SF280000 = 0x255b;
  t.SF360000 = 0x255e;
  t.SF370000 = 0x255f;
  t.SF380000 = 0x255a;
  t.SF390000 = 0x2554;
  t.SF400000 = 0x2569;
  t.SF410000 = 0x2566;
  t.SF420000 = 0x2560;
  t.SF430000 = 0x2550;
  t.SF440000 = 0x256c;
  t.SF450000 = 0x2567;
  t.SF460000 = 0x2568;
  t.SF470000 = 0x2564;
  t.SF480000 = 0x2565;
  t.SF490000 = 0x2559;
  t.SF500000 = 0x2558;
  t.SF510000 = 0x2552;
  t.SF520000 = 0x2553;
  t.SF530000 = 0x256b;
  t.SF540000 = 0x256a;
  t.Sacute = 0x015a;
  t.Sacutedotaccent = 0x1e64;
  t.Sampigreek = 0x03e0;
  t.Scaron = 0x0160;
  t.Scarondotaccent = 0x1e66;
  t.Scaronsmall = 0xf6fd;
  t.Scedilla = 0x015e;
  t.Schwa = 0x018f;
  t.Schwacyrillic = 0x04d8;
  t.Schwadieresiscyrillic = 0x04da;
  t.Scircle = 0x24c8;
  t.Scircumflex = 0x015c;
  t.Scommaaccent = 0x0218;
  t.Sdotaccent = 0x1e60;
  t.Sdotbelow = 0x1e62;
  t.Sdotbelowdotaccent = 0x1e68;
  t.Seharmenian = 0x054d;
  t.Sevenroman = 0x2166;
  t.Shaarmenian = 0x0547;
  t.Shacyrillic = 0x0428;
  t.Shchacyrillic = 0x0429;
  t.Sheicoptic = 0x03e2;
  t.Shhacyrillic = 0x04ba;
  t.Shimacoptic = 0x03ec;
  t.Sigma = 0x03a3;
  t.Sixroman = 0x2165;
  t.Smonospace = 0xff33;
  t.Softsigncyrillic = 0x042c;
  t.Ssmall = 0xf773;
  t.Stigmagreek = 0x03da;
  t.T = 0x0054;
  t.Tau = 0x03a4;
  t.Tbar = 0x0166;
  t.Tcaron = 0x0164;
  t.Tcedilla = 0x0162;
  t.Tcircle = 0x24c9;
  t.Tcircumflexbelow = 0x1e70;
  t.Tcommaaccent = 0x0162;
  t.Tdotaccent = 0x1e6a;
  t.Tdotbelow = 0x1e6c;
  t.Tecyrillic = 0x0422;
  t.Tedescendercyrillic = 0x04ac;
  t.Tenroman = 0x2169;
  t.Tetsecyrillic = 0x04b4;
  t.Theta = 0x0398;
  t.Thook = 0x01ac;
  t.Thorn = 0x00de;
  t.Thornsmall = 0xf7fe;
  t.Threeroman = 0x2162;
  t.Tildesmall = 0xf6fe;
  t.Tiwnarmenian = 0x054f;
  t.Tlinebelow = 0x1e6e;
  t.Tmonospace = 0xff34;
  t.Toarmenian = 0x0539;
  t.Tonefive = 0x01bc;
  t.Tonesix = 0x0184;
  t.Tonetwo = 0x01a7;
  t.Tretroflexhook = 0x01ae;
  t.Tsecyrillic = 0x0426;
  t.Tshecyrillic = 0x040b;
  t.Tsmall = 0xf774;
  t.Twelveroman = 0x216b;
  t.Tworoman = 0x2161;
  t.U = 0x0055;
  t.Uacute = 0x00da;
  t.Uacutesmall = 0xf7fa;
  t.Ubreve = 0x016c;
  t.Ucaron = 0x01d3;
  t.Ucircle = 0x24ca;
  t.Ucircumflex = 0x00db;
  t.Ucircumflexbelow = 0x1e76;
  t.Ucircumflexsmall = 0xf7fb;
  t.Ucyrillic = 0x0423;
  t.Udblacute = 0x0170;
  t.Udblgrave = 0x0214;
  t.Udieresis = 0x00dc;
  t.Udieresisacute = 0x01d7;
  t.Udieresisbelow = 0x1e72;
  t.Udieresiscaron = 0x01d9;
  t.Udieresiscyrillic = 0x04f0;
  t.Udieresisgrave = 0x01db;
  t.Udieresismacron = 0x01d5;
  t.Udieresissmall = 0xf7fc;
  t.Udotbelow = 0x1ee4;
  t.Ugrave = 0x00d9;
  t.Ugravesmall = 0xf7f9;
  t.Uhookabove = 0x1ee6;
  t.Uhorn = 0x01af;
  t.Uhornacute = 0x1ee8;
  t.Uhorndotbelow = 0x1ef0;
  t.Uhorngrave = 0x1eea;
  t.Uhornhookabove = 0x1eec;
  t.Uhorntilde = 0x1eee;
  t.Uhungarumlaut = 0x0170;
  t.Uhungarumlautcyrillic = 0x04f2;
  t.Uinvertedbreve = 0x0216;
  t.Ukcyrillic = 0x0478;
  t.Umacron = 0x016a;
  t.Umacroncyrillic = 0x04ee;
  t.Umacrondieresis = 0x1e7a;
  t.Umonospace = 0xff35;
  t.Uogonek = 0x0172;
  t.Upsilon = 0x03a5;
  t.Upsilon1 = 0x03d2;
  t.Upsilonacutehooksymbolgreek = 0x03d3;
  t.Upsilonafrican = 0x01b1;
  t.Upsilondieresis = 0x03ab;
  t.Upsilondieresishooksymbolgreek = 0x03d4;
  t.Upsilonhooksymbol = 0x03d2;
  t.Upsilontonos = 0x038e;
  t.Uring = 0x016e;
  t.Ushortcyrillic = 0x040e;
  t.Usmall = 0xf775;
  t.Ustraightcyrillic = 0x04ae;
  t.Ustraightstrokecyrillic = 0x04b0;
  t.Utilde = 0x0168;
  t.Utildeacute = 0x1e78;
  t.Utildebelow = 0x1e74;
  t.V = 0x0056;
  t.Vcircle = 0x24cb;
  t.Vdotbelow = 0x1e7e;
  t.Vecyrillic = 0x0412;
  t.Vewarmenian = 0x054e;
  t.Vhook = 0x01b2;
  t.Vmonospace = 0xff36;
  t.Voarmenian = 0x0548;
  t.Vsmall = 0xf776;
  t.Vtilde = 0x1e7c;
  t.W = 0x0057;
  t.Wacute = 0x1e82;
  t.Wcircle = 0x24cc;
  t.Wcircumflex = 0x0174;
  t.Wdieresis = 0x1e84;
  t.Wdotaccent = 0x1e86;
  t.Wdotbelow = 0x1e88;
  t.Wgrave = 0x1e80;
  t.Wmonospace = 0xff37;
  t.Wsmall = 0xf777;
  t.X = 0x0058;
  t.Xcircle = 0x24cd;
  t.Xdieresis = 0x1e8c;
  t.Xdotaccent = 0x1e8a;
  t.Xeharmenian = 0x053d;
  t.Xi = 0x039e;
  t.Xmonospace = 0xff38;
  t.Xsmall = 0xf778;
  t.Y = 0x0059;
  t.Yacute = 0x00dd;
  t.Yacutesmall = 0xf7fd;
  t.Yatcyrillic = 0x0462;
  t.Ycircle = 0x24ce;
  t.Ycircumflex = 0x0176;
  t.Ydieresis = 0x0178;
  t.Ydieresissmall = 0xf7ff;
  t.Ydotaccent = 0x1e8e;
  t.Ydotbelow = 0x1ef4;
  t.Yericyrillic = 0x042b;
  t.Yerudieresiscyrillic = 0x04f8;
  t.Ygrave = 0x1ef2;
  t.Yhook = 0x01b3;
  t.Yhookabove = 0x1ef6;
  t.Yiarmenian = 0x0545;
  t.Yicyrillic = 0x0407;
  t.Yiwnarmenian = 0x0552;
  t.Ymonospace = 0xff39;
  t.Ysmall = 0xf779;
  t.Ytilde = 0x1ef8;
  t.Yusbigcyrillic = 0x046a;
  t.Yusbigiotifiedcyrillic = 0x046c;
  t.Yuslittlecyrillic = 0x0466;
  t.Yuslittleiotifiedcyrillic = 0x0468;
  t.Z = 0x005a;
  t.Zaarmenian = 0x0536;
  t.Zacute = 0x0179;
  t.Zcaron = 0x017d;
  t.Zcaronsmall = 0xf6ff;
  t.Zcircle = 0x24cf;
  t.Zcircumflex = 0x1e90;
  t.Zdot = 0x017b;
  t.Zdotaccent = 0x017b;
  t.Zdotbelow = 0x1e92;
  t.Zecyrillic = 0x0417;
  t.Zedescendercyrillic = 0x0498;
  t.Zedieresiscyrillic = 0x04de;
  t.Zeta = 0x0396;
  t.Zhearmenian = 0x053a;
  t.Zhebrevecyrillic = 0x04c1;
  t.Zhecyrillic = 0x0416;
  t.Zhedescendercyrillic = 0x0496;
  t.Zhedieresiscyrillic = 0x04dc;
  t.Zlinebelow = 0x1e94;
  t.Zmonospace = 0xff3a;
  t.Zsmall = 0xf77a;
  t.Zstroke = 0x01b5;
  t.a = 0x0061;
  t.aabengali = 0x0986;
  t.aacute = 0x00e1;
  t.aadeva = 0x0906;
  t.aagujarati = 0x0a86;
  t.aagurmukhi = 0x0a06;
  t.aamatragurmukhi = 0x0a3e;
  t.aarusquare = 0x3303;
  t.aavowelsignbengali = 0x09be;
  t.aavowelsigndeva = 0x093e;
  t.aavowelsigngujarati = 0x0abe;
  t.abbreviationmarkarmenian = 0x055f;
  t.abbreviationsigndeva = 0x0970;
  t.abengali = 0x0985;
  t.abopomofo = 0x311a;
  t.abreve = 0x0103;
  t.abreveacute = 0x1eaf;
  t.abrevecyrillic = 0x04d1;
  t.abrevedotbelow = 0x1eb7;
  t.abrevegrave = 0x1eb1;
  t.abrevehookabove = 0x1eb3;
  t.abrevetilde = 0x1eb5;
  t.acaron = 0x01ce;
  t.acircle = 0x24d0;
  t.acircumflex = 0x00e2;
  t.acircumflexacute = 0x1ea5;
  t.acircumflexdotbelow = 0x1ead;
  t.acircumflexgrave = 0x1ea7;
  t.acircumflexhookabove = 0x1ea9;
  t.acircumflextilde = 0x1eab;
  t.acute = 0x00b4;
  t.acutebelowcmb = 0x0317;
  t.acutecmb = 0x0301;
  t.acutecomb = 0x0301;
  t.acutedeva = 0x0954;
  t.acutelowmod = 0x02cf;
  t.acutetonecmb = 0x0341;
  t.acyrillic = 0x0430;
  t.adblgrave = 0x0201;
  t.addakgurmukhi = 0x0a71;
  t.adeva = 0x0905;
  t.adieresis = 0x00e4;
  t.adieresiscyrillic = 0x04d3;
  t.adieresismacron = 0x01df;
  t.adotbelow = 0x1ea1;
  t.adotmacron = 0x01e1;
  t.ae = 0x00e6;
  t.aeacute = 0x01fd;
  t.aekorean = 0x3150;
  t.aemacron = 0x01e3;
  t.afii00208 = 0x2015;
  t.afii08941 = 0x20a4;
  t.afii10017 = 0x0410;
  t.afii10018 = 0x0411;
  t.afii10019 = 0x0412;
  t.afii10020 = 0x0413;
  t.afii10021 = 0x0414;
  t.afii10022 = 0x0415;
  t.afii10023 = 0x0401;
  t.afii10024 = 0x0416;
  t.afii10025 = 0x0417;
  t.afii10026 = 0x0418;
  t.afii10027 = 0x0419;
  t.afii10028 = 0x041a;
  t.afii10029 = 0x041b;
  t.afii10030 = 0x041c;
  t.afii10031 = 0x041d;
  t.afii10032 = 0x041e;
  t.afii10033 = 0x041f;
  t.afii10034 = 0x0420;
  t.afii10035 = 0x0421;
  t.afii10036 = 0x0422;
  t.afii10037 = 0x0423;
  t.afii10038 = 0x0424;
  t.afii10039 = 0x0425;
  t.afii10040 = 0x0426;
  t.afii10041 = 0x0427;
  t.afii10042 = 0x0428;
  t.afii10043 = 0x0429;
  t.afii10044 = 0x042a;
  t.afii10045 = 0x042b;
  t.afii10046 = 0x042c;
  t.afii10047 = 0x042d;
  t.afii10048 = 0x042e;
  t.afii10049 = 0x042f;
  t.afii10050 = 0x0490;
  t.afii10051 = 0x0402;
  t.afii10052 = 0x0403;
  t.afii10053 = 0x0404;
  t.afii10054 = 0x0405;
  t.afii10055 = 0x0406;
  t.afii10056 = 0x0407;
  t.afii10057 = 0x0408;
  t.afii10058 = 0x0409;
  t.afii10059 = 0x040a;
  t.afii10060 = 0x040b;
  t.afii10061 = 0x040c;
  t.afii10062 = 0x040e;
  t.afii10063 = 0xf6c4;
  t.afii10064 = 0xf6c5;
  t.afii10065 = 0x0430;
  t.afii10066 = 0x0431;
  t.afii10067 = 0x0432;
  t.afii10068 = 0x0433;
  t.afii10069 = 0x0434;
  t.afii10070 = 0x0435;
  t.afii10071 = 0x0451;
  t.afii10072 = 0x0436;
  t.afii10073 = 0x0437;
  t.afii10074 = 0x0438;
  t.afii10075 = 0x0439;
  t.afii10076 = 0x043a;
  t.afii10077 = 0x043b;
  t.afii10078 = 0x043c;
  t.afii10079 = 0x043d;
  t.afii10080 = 0x043e;
  t.afii10081 = 0x043f;
  t.afii10082 = 0x0440;
  t.afii10083 = 0x0441;
  t.afii10084 = 0x0442;
  t.afii10085 = 0x0443;
  t.afii10086 = 0x0444;
  t.afii10087 = 0x0445;
  t.afii10088 = 0x0446;
  t.afii10089 = 0x0447;
  t.afii10090 = 0x0448;
  t.afii10091 = 0x0449;
  t.afii10092 = 0x044a;
  t.afii10093 = 0x044b;
  t.afii10094 = 0x044c;
  t.afii10095 = 0x044d;
  t.afii10096 = 0x044e;
  t.afii10097 = 0x044f;
  t.afii10098 = 0x0491;
  t.afii10099 = 0x0452;
  t.afii10100 = 0x0453;
  t.afii10101 = 0x0454;
  t.afii10102 = 0x0455;
  t.afii10103 = 0x0456;
  t.afii10104 = 0x0457;
  t.afii10105 = 0x0458;
  t.afii10106 = 0x0459;
  t.afii10107 = 0x045a;
  t.afii10108 = 0x045b;
  t.afii10109 = 0x045c;
  t.afii10110 = 0x045e;
  t.afii10145 = 0x040f;
  t.afii10146 = 0x0462;
  t.afii10147 = 0x0472;
  t.afii10148 = 0x0474;
  t.afii10192 = 0xf6c6;
  t.afii10193 = 0x045f;
  t.afii10194 = 0x0463;
  t.afii10195 = 0x0473;
  t.afii10196 = 0x0475;
  t.afii10831 = 0xf6c7;
  t.afii10832 = 0xf6c8;
  t.afii10846 = 0x04d9;
  t.afii299 = 0x200e;
  t.afii300 = 0x200f;
  t.afii301 = 0x200d;
  t.afii57381 = 0x066a;
  t.afii57388 = 0x060c;
  t.afii57392 = 0x0660;
  t.afii57393 = 0x0661;
  t.afii57394 = 0x0662;
  t.afii57395 = 0x0663;
  t.afii57396 = 0x0664;
  t.afii57397 = 0x0665;
  t.afii57398 = 0x0666;
  t.afii57399 = 0x0667;
  t.afii57400 = 0x0668;
  t.afii57401 = 0x0669;
  t.afii57403 = 0x061b;
  t.afii57407 = 0x061f;
  t.afii57409 = 0x0621;
  t.afii57410 = 0x0622;
  t.afii57411 = 0x0623;
  t.afii57412 = 0x0624;
  t.afii57413 = 0x0625;
  t.afii57414 = 0x0626;
  t.afii57415 = 0x0627;
  t.afii57416 = 0x0628;
  t.afii57417 = 0x0629;
  t.afii57418 = 0x062a;
  t.afii57419 = 0x062b;
  t.afii57420 = 0x062c;
  t.afii57421 = 0x062d;
  t.afii57422 = 0x062e;
  t.afii57423 = 0x062f;
  t.afii57424 = 0x0630;
  t.afii57425 = 0x0631;
  t.afii57426 = 0x0632;
  t.afii57427 = 0x0633;
  t.afii57428 = 0x0634;
  t.afii57429 = 0x0635;
  t.afii57430 = 0x0636;
  t.afii57431 = 0x0637;
  t.afii57432 = 0x0638;
  t.afii57433 = 0x0639;
  t.afii57434 = 0x063a;
  t.afii57440 = 0x0640;
  t.afii57441 = 0x0641;
  t.afii57442 = 0x0642;
  t.afii57443 = 0x0643;
  t.afii57444 = 0x0644;
  t.afii57445 = 0x0645;
  t.afii57446 = 0x0646;
  t.afii57448 = 0x0648;
  t.afii57449 = 0x0649;
  t.afii57450 = 0x064a;
  t.afii57451 = 0x064b;
  t.afii57452 = 0x064c;
  t.afii57453 = 0x064d;
  t.afii57454 = 0x064e;
  t.afii57455 = 0x064f;
  t.afii57456 = 0x0650;
  t.afii57457 = 0x0651;
  t.afii57458 = 0x0652;
  t.afii57470 = 0x0647;
  t.afii57505 = 0x06a4;
  t.afii57506 = 0x067e;
  t.afii57507 = 0x0686;
  t.afii57508 = 0x0698;
  t.afii57509 = 0x06af;
  t.afii57511 = 0x0679;
  t.afii57512 = 0x0688;
  t.afii57513 = 0x0691;
  t.afii57514 = 0x06ba;
  t.afii57519 = 0x06d2;
  t.afii57534 = 0x06d5;
  t.afii57636 = 0x20aa;
  t.afii57645 = 0x05be;
  t.afii57658 = 0x05c3;
  t.afii57664 = 0x05d0;
  t.afii57665 = 0x05d1;
  t.afii57666 = 0x05d2;
  t.afii57667 = 0x05d3;
  t.afii57668 = 0x05d4;
  t.afii57669 = 0x05d5;
  t.afii57670 = 0x05d6;
  t.afii57671 = 0x05d7;
  t.afii57672 = 0x05d8;
  t.afii57673 = 0x05d9;
  t.afii57674 = 0x05da;
  t.afii57675 = 0x05db;
  t.afii57676 = 0x05dc;
  t.afii57677 = 0x05dd;
  t.afii57678 = 0x05de;
  t.afii57679 = 0x05df;
  t.afii57680 = 0x05e0;
  t.afii57681 = 0x05e1;
  t.afii57682 = 0x05e2;
  t.afii57683 = 0x05e3;
  t.afii57684 = 0x05e4;
  t.afii57685 = 0x05e5;
  t.afii57686 = 0x05e6;
  t.afii57687 = 0x05e7;
  t.afii57688 = 0x05e8;
  t.afii57689 = 0x05e9;
  t.afii57690 = 0x05ea;
  t.afii57694 = 0xfb2a;
  t.afii57695 = 0xfb2b;
  t.afii57700 = 0xfb4b;
  t.afii57705 = 0xfb1f;
  t.afii57716 = 0x05f0;
  t.afii57717 = 0x05f1;
  t.afii57718 = 0x05f2;
  t.afii57723 = 0xfb35;
  t.afii57793 = 0x05b4;
  t.afii57794 = 0x05b5;
  t.afii57795 = 0x05b6;
  t.afii57796 = 0x05bb;
  t.afii57797 = 0x05b8;
  t.afii57798 = 0x05b7;
  t.afii57799 = 0x05b0;
  t.afii57800 = 0x05b2;
  t.afii57801 = 0x05b1;
  t.afii57802 = 0x05b3;
  t.afii57803 = 0x05c2;
  t.afii57804 = 0x05c1;
  t.afii57806 = 0x05b9;
  t.afii57807 = 0x05bc;
  t.afii57839 = 0x05bd;
  t.afii57841 = 0x05bf;
  t.afii57842 = 0x05c0;
  t.afii57929 = 0x02bc;
  t.afii61248 = 0x2105;
  t.afii61289 = 0x2113;
  t.afii61352 = 0x2116;
  t.afii61573 = 0x202c;
  t.afii61574 = 0x202d;
  t.afii61575 = 0x202e;
  t.afii61664 = 0x200c;
  t.afii63167 = 0x066d;
  t.afii64937 = 0x02bd;
  t.agrave = 0x00e0;
  t.agujarati = 0x0a85;
  t.agurmukhi = 0x0a05;
  t.ahiragana = 0x3042;
  t.ahookabove = 0x1ea3;
  t.aibengali = 0x0990;
  t.aibopomofo = 0x311e;
  t.aideva = 0x0910;
  t.aiecyrillic = 0x04d5;
  t.aigujarati = 0x0a90;
  t.aigurmukhi = 0x0a10;
  t.aimatragurmukhi = 0x0a48;
  t.ainarabic = 0x0639;
  t.ainfinalarabic = 0xfeca;
  t.aininitialarabic = 0xfecb;
  t.ainmedialarabic = 0xfecc;
  t.ainvertedbreve = 0x0203;
  t.aivowelsignbengali = 0x09c8;
  t.aivowelsigndeva = 0x0948;
  t.aivowelsigngujarati = 0x0ac8;
  t.akatakana = 0x30a2;
  t.akatakanahalfwidth = 0xff71;
  t.akorean = 0x314f;
  t.alef = 0x05d0;
  t.alefarabic = 0x0627;
  t.alefdageshhebrew = 0xfb30;
  t.aleffinalarabic = 0xfe8e;
  t.alefhamzaabovearabic = 0x0623;
  t.alefhamzaabovefinalarabic = 0xfe84;
  t.alefhamzabelowarabic = 0x0625;
  t.alefhamzabelowfinalarabic = 0xfe88;
  t.alefhebrew = 0x05d0;
  t.aleflamedhebrew = 0xfb4f;
  t.alefmaddaabovearabic = 0x0622;
  t.alefmaddaabovefinalarabic = 0xfe82;
  t.alefmaksuraarabic = 0x0649;
  t.alefmaksurafinalarabic = 0xfef0;
  t.alefmaksurainitialarabic = 0xfef3;
  t.alefmaksuramedialarabic = 0xfef4;
  t.alefpatahhebrew = 0xfb2e;
  t.alefqamatshebrew = 0xfb2f;
  t.aleph = 0x2135;
  t.allequal = 0x224c;
  t.alpha = 0x03b1;
  t.alphatonos = 0x03ac;
  t.amacron = 0x0101;
  t.amonospace = 0xff41;
  t.ampersand = 0x0026;
  t.ampersandmonospace = 0xff06;
  t.ampersandsmall = 0xf726;
  t.amsquare = 0x33c2;
  t.anbopomofo = 0x3122;
  t.angbopomofo = 0x3124;
  t.angbracketleft = 0x3008;
  t.angbracketright = 0x3009;
  t.angkhankhuthai = 0x0e5a;
  t.angle = 0x2220;
  t.anglebracketleft = 0x3008;
  t.anglebracketleftvertical = 0xfe3f;
  t.anglebracketright = 0x3009;
  t.anglebracketrightvertical = 0xfe40;
  t.angleleft = 0x2329;
  t.angleright = 0x232a;
  t.angstrom = 0x212b;
  t.anoteleia = 0x0387;
  t.anudattadeva = 0x0952;
  t.anusvarabengali = 0x0982;
  t.anusvaradeva = 0x0902;
  t.anusvaragujarati = 0x0a82;
  t.aogonek = 0x0105;
  t.apaatosquare = 0x3300;
  t.aparen = 0x249c;
  t.apostrophearmenian = 0x055a;
  t.apostrophemod = 0x02bc;
  t.apple = 0xf8ff;
  t.approaches = 0x2250;
  t.approxequal = 0x2248;
  t.approxequalorimage = 0x2252;
  t.approximatelyequal = 0x2245;
  t.araeaekorean = 0x318e;
  t.araeakorean = 0x318d;
  t.arc = 0x2312;
  t.arighthalfring = 0x1e9a;
  t.aring = 0x00e5;
  t.aringacute = 0x01fb;
  t.aringbelow = 0x1e01;
  t.arrowboth = 0x2194;
  t.arrowdashdown = 0x21e3;
  t.arrowdashleft = 0x21e0;
  t.arrowdashright = 0x21e2;
  t.arrowdashup = 0x21e1;
  t.arrowdblboth = 0x21d4;
  t.arrowdbldown = 0x21d3;
  t.arrowdblleft = 0x21d0;
  t.arrowdblright = 0x21d2;
  t.arrowdblup = 0x21d1;
  t.arrowdown = 0x2193;
  t.arrowdownleft = 0x2199;
  t.arrowdownright = 0x2198;
  t.arrowdownwhite = 0x21e9;
  t.arrowheaddownmod = 0x02c5;
  t.arrowheadleftmod = 0x02c2;
  t.arrowheadrightmod = 0x02c3;
  t.arrowheadupmod = 0x02c4;
  t.arrowhorizex = 0xf8e7;
  t.arrowleft = 0x2190;
  t.arrowleftdbl = 0x21d0;
  t.arrowleftdblstroke = 0x21cd;
  t.arrowleftoverright = 0x21c6;
  t.arrowleftwhite = 0x21e6;
  t.arrowright = 0x2192;
  t.arrowrightdblstroke = 0x21cf;
  t.arrowrightheavy = 0x279e;
  t.arrowrightoverleft = 0x21c4;
  t.arrowrightwhite = 0x21e8;
  t.arrowtableft = 0x21e4;
  t.arrowtabright = 0x21e5;
  t.arrowup = 0x2191;
  t.arrowupdn = 0x2195;
  t.arrowupdnbse = 0x21a8;
  t.arrowupdownbase = 0x21a8;
  t.arrowupleft = 0x2196;
  t.arrowupleftofdown = 0x21c5;
  t.arrowupright = 0x2197;
  t.arrowupwhite = 0x21e7;
  t.arrowvertex = 0xf8e6;
  t.asciicircum = 0x005e;
  t.asciicircummonospace = 0xff3e;
  t.asciitilde = 0x007e;
  t.asciitildemonospace = 0xff5e;
  t.ascript = 0x0251;
  t.ascriptturned = 0x0252;
  t.asmallhiragana = 0x3041;
  t.asmallkatakana = 0x30a1;
  t.asmallkatakanahalfwidth = 0xff67;
  t.asterisk = 0x002a;
  t.asteriskaltonearabic = 0x066d;
  t.asteriskarabic = 0x066d;
  t.asteriskmath = 0x2217;
  t.asteriskmonospace = 0xff0a;
  t.asterisksmall = 0xfe61;
  t.asterism = 0x2042;
  t.asuperior = 0xf6e9;
  t.asymptoticallyequal = 0x2243;
  t.at = 0x0040;
  t.atilde = 0x00e3;
  t.atmonospace = 0xff20;
  t.atsmall = 0xfe6b;
  t.aturned = 0x0250;
  t.aubengali = 0x0994;
  t.aubopomofo = 0x3120;
  t.audeva = 0x0914;
  t.augujarati = 0x0a94;
  t.augurmukhi = 0x0a14;
  t.aulengthmarkbengali = 0x09d7;
  t.aumatragurmukhi = 0x0a4c;
  t.auvowelsignbengali = 0x09cc;
  t.auvowelsigndeva = 0x094c;
  t.auvowelsigngujarati = 0x0acc;
  t.avagrahadeva = 0x093d;
  t.aybarmenian = 0x0561;
  t.ayin = 0x05e2;
  t.ayinaltonehebrew = 0xfb20;
  t.ayinhebrew = 0x05e2;
  t.b = 0x0062;
  t.babengali = 0x09ac;
  t.backslash = 0x005c;
  t.backslashmonospace = 0xff3c;
  t.badeva = 0x092c;
  t.bagujarati = 0x0aac;
  t.bagurmukhi = 0x0a2c;
  t.bahiragana = 0x3070;
  t.bahtthai = 0x0e3f;
  t.bakatakana = 0x30d0;
  t.bar = 0x007c;
  t.barmonospace = 0xff5c;
  t.bbopomofo = 0x3105;
  t.bcircle = 0x24d1;
  t.bdotaccent = 0x1e03;
  t.bdotbelow = 0x1e05;
  t.beamedsixteenthnotes = 0x266c;
  t.because = 0x2235;
  t.becyrillic = 0x0431;
  t.beharabic = 0x0628;
  t.behfinalarabic = 0xfe90;
  t.behinitialarabic = 0xfe91;
  t.behiragana = 0x3079;
  t.behmedialarabic = 0xfe92;
  t.behmeeminitialarabic = 0xfc9f;
  t.behmeemisolatedarabic = 0xfc08;
  t.behnoonfinalarabic = 0xfc6d;
  t.bekatakana = 0x30d9;
  t.benarmenian = 0x0562;
  t.bet = 0x05d1;
  t.beta = 0x03b2;
  t.betasymbolgreek = 0x03d0;
  t.betdagesh = 0xfb31;
  t.betdageshhebrew = 0xfb31;
  t.bethebrew = 0x05d1;
  t.betrafehebrew = 0xfb4c;
  t.bhabengali = 0x09ad;
  t.bhadeva = 0x092d;
  t.bhagujarati = 0x0aad;
  t.bhagurmukhi = 0x0a2d;
  t.bhook = 0x0253;
  t.bihiragana = 0x3073;
  t.bikatakana = 0x30d3;
  t.bilabialclick = 0x0298;
  t.bindigurmukhi = 0x0a02;
  t.birusquare = 0x3331;
  t.blackcircle = 0x25cf;
  t.blackdiamond = 0x25c6;
  t.blackdownpointingtriangle = 0x25bc;
  t.blackleftpointingpointer = 0x25c4;
  t.blackleftpointingtriangle = 0x25c0;
  t.blacklenticularbracketleft = 0x3010;
  t.blacklenticularbracketleftvertical = 0xfe3b;
  t.blacklenticularbracketright = 0x3011;
  t.blacklenticularbracketrightvertical = 0xfe3c;
  t.blacklowerlefttriangle = 0x25e3;
  t.blacklowerrighttriangle = 0x25e2;
  t.blackrectangle = 0x25ac;
  t.blackrightpointingpointer = 0x25ba;
  t.blackrightpointingtriangle = 0x25b6;
  t.blacksmallsquare = 0x25aa;
  t.blacksmilingface = 0x263b;
  t.blacksquare = 0x25a0;
  t.blackstar = 0x2605;
  t.blackupperlefttriangle = 0x25e4;
  t.blackupperrighttriangle = 0x25e5;
  t.blackuppointingsmalltriangle = 0x25b4;
  t.blackuppointingtriangle = 0x25b2;
  t.blank = 0x2423;
  t.blinebelow = 0x1e07;
  t.block = 0x2588;
  t.bmonospace = 0xff42;
  t.bobaimaithai = 0x0e1a;
  t.bohiragana = 0x307c;
  t.bokatakana = 0x30dc;
  t.bparen = 0x249d;
  t.bqsquare = 0x33c3;
  t.braceex = 0xf8f4;
  t.braceleft = 0x007b;
  t.braceleftbt = 0xf8f3;
  t.braceleftmid = 0xf8f2;
  t.braceleftmonospace = 0xff5b;
  t.braceleftsmall = 0xfe5b;
  t.bracelefttp = 0xf8f1;
  t.braceleftvertical = 0xfe37;
  t.braceright = 0x007d;
  t.bracerightbt = 0xf8fe;
  t.bracerightmid = 0xf8fd;
  t.bracerightmonospace = 0xff5d;
  t.bracerightsmall = 0xfe5c;
  t.bracerighttp = 0xf8fc;
  t.bracerightvertical = 0xfe38;
  t.bracketleft = 0x005b;
  t.bracketleftbt = 0xf8f0;
  t.bracketleftex = 0xf8ef;
  t.bracketleftmonospace = 0xff3b;
  t.bracketlefttp = 0xf8ee;
  t.bracketright = 0x005d;
  t.bracketrightbt = 0xf8fb;
  t.bracketrightex = 0xf8fa;
  t.bracketrightmonospace = 0xff3d;
  t.bracketrighttp = 0xf8f9;
  t.breve = 0x02d8;
  t.brevebelowcmb = 0x032e;
  t.brevecmb = 0x0306;
  t.breveinvertedbelowcmb = 0x032f;
  t.breveinvertedcmb = 0x0311;
  t.breveinverteddoublecmb = 0x0361;
  t.bridgebelowcmb = 0x032a;
  t.bridgeinvertedbelowcmb = 0x033a;
  t.brokenbar = 0x00a6;
  t.bstroke = 0x0180;
  t.bsuperior = 0xf6ea;
  t.btopbar = 0x0183;
  t.buhiragana = 0x3076;
  t.bukatakana = 0x30d6;
  t.bullet = 0x2022;
  t.bulletinverse = 0x25d8;
  t.bulletoperator = 0x2219;
  t.bullseye = 0x25ce;
  t.c = 0x0063;
  t.caarmenian = 0x056e;
  t.cabengali = 0x099a;
  t.cacute = 0x0107;
  t.cadeva = 0x091a;
  t.cagujarati = 0x0a9a;
  t.cagurmukhi = 0x0a1a;
  t.calsquare = 0x3388;
  t.candrabindubengali = 0x0981;
  t.candrabinducmb = 0x0310;
  t.candrabindudeva = 0x0901;
  t.candrabindugujarati = 0x0a81;
  t.capslock = 0x21ea;
  t.careof = 0x2105;
  t.caron = 0x02c7;
  t.caronbelowcmb = 0x032c;
  t.caroncmb = 0x030c;
  t.carriagereturn = 0x21b5;
  t.cbopomofo = 0x3118;
  t.ccaron = 0x010d;
  t.ccedilla = 0x00e7;
  t.ccedillaacute = 0x1e09;
  t.ccircle = 0x24d2;
  t.ccircumflex = 0x0109;
  t.ccurl = 0x0255;
  t.cdot = 0x010b;
  t.cdotaccent = 0x010b;
  t.cdsquare = 0x33c5;
  t.cedilla = 0x00b8;
  t.cedillacmb = 0x0327;
  t.cent = 0x00a2;
  t.centigrade = 0x2103;
  t.centinferior = 0xf6df;
  t.centmonospace = 0xffe0;
  t.centoldstyle = 0xf7a2;
  t.centsuperior = 0xf6e0;
  t.chaarmenian = 0x0579;
  t.chabengali = 0x099b;
  t.chadeva = 0x091b;
  t.chagujarati = 0x0a9b;
  t.chagurmukhi = 0x0a1b;
  t.chbopomofo = 0x3114;
  t.cheabkhasiancyrillic = 0x04bd;
  t.checkmark = 0x2713;
  t.checyrillic = 0x0447;
  t.chedescenderabkhasiancyrillic = 0x04bf;
  t.chedescendercyrillic = 0x04b7;
  t.chedieresiscyrillic = 0x04f5;
  t.cheharmenian = 0x0573;
  t.chekhakassiancyrillic = 0x04cc;
  t.cheverticalstrokecyrillic = 0x04b9;
  t.chi = 0x03c7;
  t.chieuchacirclekorean = 0x3277;
  t.chieuchaparenkorean = 0x3217;
  t.chieuchcirclekorean = 0x3269;
  t.chieuchkorean = 0x314a;
  t.chieuchparenkorean = 0x3209;
  t.chochangthai = 0x0e0a;
  t.chochanthai = 0x0e08;
  t.chochingthai = 0x0e09;
  t.chochoethai = 0x0e0c;
  t.chook = 0x0188;
  t.cieucacirclekorean = 0x3276;
  t.cieucaparenkorean = 0x3216;
  t.cieuccirclekorean = 0x3268;
  t.cieuckorean = 0x3148;
  t.cieucparenkorean = 0x3208;
  t.cieucuparenkorean = 0x321c;
  t.circle = 0x25cb;
  t.circlecopyrt = 0x00a9;
  t.circlemultiply = 0x2297;
  t.circleot = 0x2299;
  t.circleplus = 0x2295;
  t.circlepostalmark = 0x3036;
  t.circlewithlefthalfblack = 0x25d0;
  t.circlewithrighthalfblack = 0x25d1;
  t.circumflex = 0x02c6;
  t.circumflexbelowcmb = 0x032d;
  t.circumflexcmb = 0x0302;
  t.clear = 0x2327;
  t.clickalveolar = 0x01c2;
  t.clickdental = 0x01c0;
  t.clicklateral = 0x01c1;
  t.clickretroflex = 0x01c3;
  t.club = 0x2663;
  t.clubsuitblack = 0x2663;
  t.clubsuitwhite = 0x2667;
  t.cmcubedsquare = 0x33a4;
  t.cmonospace = 0xff43;
  t.cmsquaredsquare = 0x33a0;
  t.coarmenian = 0x0581;
  t.colon = 0x003a;
  t.colonmonetary = 0x20a1;
  t.colonmonospace = 0xff1a;
  t.colonsign = 0x20a1;
  t.colonsmall = 0xfe55;
  t.colontriangularhalfmod = 0x02d1;
  t.colontriangularmod = 0x02d0;
  t.comma = 0x002c;
  t.commaabovecmb = 0x0313;
  t.commaaboverightcmb = 0x0315;
  t.commaaccent = 0xf6c3;
  t.commaarabic = 0x060c;
  t.commaarmenian = 0x055d;
  t.commainferior = 0xf6e1;
  t.commamonospace = 0xff0c;
  t.commareversedabovecmb = 0x0314;
  t.commareversedmod = 0x02bd;
  t.commasmall = 0xfe50;
  t.commasuperior = 0xf6e2;
  t.commaturnedabovecmb = 0x0312;
  t.commaturnedmod = 0x02bb;
  t.compass = 0x263c;
  t.congruent = 0x2245;
  t.contourintegral = 0x222e;
  t.control = 0x2303;
  t.controlACK = 0x0006;
  t.controlBEL = 0x0007;
  t.controlBS = 0x0008;
  t.controlCAN = 0x0018;
  t.controlCR = 0x000d;
  t.controlDC1 = 0x0011;
  t.controlDC2 = 0x0012;
  t.controlDC3 = 0x0013;
  t.controlDC4 = 0x0014;
  t.controlDEL = 0x007f;
  t.controlDLE = 0x0010;
  t.controlEM = 0x0019;
  t.controlENQ = 0x0005;
  t.controlEOT = 0x0004;
  t.controlESC = 0x001b;
  t.controlETB = 0x0017;
  t.controlETX = 0x0003;
  t.controlFF = 0x000c;
  t.controlFS = 0x001c;
  t.controlGS = 0x001d;
  t.controlHT = 0x0009;
  t.controlLF = 0x000a;
  t.controlNAK = 0x0015;
  t.controlNULL = 0x0000;
  t.controlRS = 0x001e;
  t.controlSI = 0x000f;
  t.controlSO = 0x000e;
  t.controlSOT = 0x0002;
  t.controlSTX = 0x0001;
  t.controlSUB = 0x001a;
  t.controlSYN = 0x0016;
  t.controlUS = 0x001f;
  t.controlVT = 0x000b;
  t.copyright = 0x00a9;
  t.copyrightsans = 0xf8e9;
  t.copyrightserif = 0xf6d9;
  t.cornerbracketleft = 0x300c;
  t.cornerbracketlefthalfwidth = 0xff62;
  t.cornerbracketleftvertical = 0xfe41;
  t.cornerbracketright = 0x300d;
  t.cornerbracketrighthalfwidth = 0xff63;
  t.cornerbracketrightvertical = 0xfe42;
  t.corporationsquare = 0x337f;
  t.cosquare = 0x33c7;
  t.coverkgsquare = 0x33c6;
  t.cparen = 0x249e;
  t.cruzeiro = 0x20a2;
  t.cstretched = 0x0297;
  t.curlyand = 0x22cf;
  t.curlyor = 0x22ce;
  t.currency = 0x00a4;
  t.cyrBreve = 0xf6d1;
  t.cyrFlex = 0xf6d2;
  t.cyrbreve = 0xf6d4;
  t.cyrflex = 0xf6d5;
  t.d = 0x0064;
  t.daarmenian = 0x0564;
  t.dabengali = 0x09a6;
  t.dadarabic = 0x0636;
  t.dadeva = 0x0926;
  t.dadfinalarabic = 0xfebe;
  t.dadinitialarabic = 0xfebf;
  t.dadmedialarabic = 0xfec0;
  t.dagesh = 0x05bc;
  t.dageshhebrew = 0x05bc;
  t.dagger = 0x2020;
  t.daggerdbl = 0x2021;
  t.dagujarati = 0x0aa6;
  t.dagurmukhi = 0x0a26;
  t.dahiragana = 0x3060;
  t.dakatakana = 0x30c0;
  t.dalarabic = 0x062f;
  t.dalet = 0x05d3;
  t.daletdagesh = 0xfb33;
  t.daletdageshhebrew = 0xfb33;
  t.dalethebrew = 0x05d3;
  t.dalfinalarabic = 0xfeaa;
  t.dammaarabic = 0x064f;
  t.dammalowarabic = 0x064f;
  t.dammatanaltonearabic = 0x064c;
  t.dammatanarabic = 0x064c;
  t.danda = 0x0964;
  t.dargahebrew = 0x05a7;
  t.dargalefthebrew = 0x05a7;
  t.dasiapneumatacyrilliccmb = 0x0485;
  t.dblGrave = 0xf6d3;
  t.dblanglebracketleft = 0x300a;
  t.dblanglebracketleftvertical = 0xfe3d;
  t.dblanglebracketright = 0x300b;
  t.dblanglebracketrightvertical = 0xfe3e;
  t.dblarchinvertedbelowcmb = 0x032b;
  t.dblarrowleft = 0x21d4;
  t.dblarrowright = 0x21d2;
  t.dbldanda = 0x0965;
  t.dblgrave = 0xf6d6;
  t.dblgravecmb = 0x030f;
  t.dblintegral = 0x222c;
  t.dbllowline = 0x2017;
  t.dbllowlinecmb = 0x0333;
  t.dbloverlinecmb = 0x033f;
  t.dblprimemod = 0x02ba;
  t.dblverticalbar = 0x2016;
  t.dblverticallineabovecmb = 0x030e;
  t.dbopomofo = 0x3109;
  t.dbsquare = 0x33c8;
  t.dcaron = 0x010f;
  t.dcedilla = 0x1e11;
  t.dcircle = 0x24d3;
  t.dcircumflexbelow = 0x1e13;
  t.dcroat = 0x0111;
  t.ddabengali = 0x09a1;
  t.ddadeva = 0x0921;
  t.ddagujarati = 0x0aa1;
  t.ddagurmukhi = 0x0a21;
  t.ddalarabic = 0x0688;
  t.ddalfinalarabic = 0xfb89;
  t.dddhadeva = 0x095c;
  t.ddhabengali = 0x09a2;
  t.ddhadeva = 0x0922;
  t.ddhagujarati = 0x0aa2;
  t.ddhagurmukhi = 0x0a22;
  t.ddotaccent = 0x1e0b;
  t.ddotbelow = 0x1e0d;
  t.decimalseparatorarabic = 0x066b;
  t.decimalseparatorpersian = 0x066b;
  t.decyrillic = 0x0434;
  t.degree = 0x00b0;
  t.dehihebrew = 0x05ad;
  t.dehiragana = 0x3067;
  t.deicoptic = 0x03ef;
  t.dekatakana = 0x30c7;
  t.deleteleft = 0x232b;
  t.deleteright = 0x2326;
  t.delta = 0x03b4;
  t.deltaturned = 0x018d;
  t.denominatorminusonenumeratorbengali = 0x09f8;
  t.dezh = 0x02a4;
  t.dhabengali = 0x09a7;
  t.dhadeva = 0x0927;
  t.dhagujarati = 0x0aa7;
  t.dhagurmukhi = 0x0a27;
  t.dhook = 0x0257;
  t.dialytikatonos = 0x0385;
  t.dialytikatonoscmb = 0x0344;
  t.diamond = 0x2666;
  t.diamondsuitwhite = 0x2662;
  t.dieresis = 0x00a8;
  t.dieresisacute = 0xf6d7;
  t.dieresisbelowcmb = 0x0324;
  t.dieresiscmb = 0x0308;
  t.dieresisgrave = 0xf6d8;
  t.dieresistonos = 0x0385;
  t.dihiragana = 0x3062;
  t.dikatakana = 0x30c2;
  t.dittomark = 0x3003;
  t.divide = 0x00f7;
  t.divides = 0x2223;
  t.divisionslash = 0x2215;
  t.djecyrillic = 0x0452;
  t.dkshade = 0x2593;
  t.dlinebelow = 0x1e0f;
  t.dlsquare = 0x3397;
  t.dmacron = 0x0111;
  t.dmonospace = 0xff44;
  t.dnblock = 0x2584;
  t.dochadathai = 0x0e0e;
  t.dodekthai = 0x0e14;
  t.dohiragana = 0x3069;
  t.dokatakana = 0x30c9;
  t.dollar = 0x0024;
  t.dollarinferior = 0xf6e3;
  t.dollarmonospace = 0xff04;
  t.dollaroldstyle = 0xf724;
  t.dollarsmall = 0xfe69;
  t.dollarsuperior = 0xf6e4;
  t.dong = 0x20ab;
  t.dorusquare = 0x3326;
  t.dotaccent = 0x02d9;
  t.dotaccentcmb = 0x0307;
  t.dotbelowcmb = 0x0323;
  t.dotbelowcomb = 0x0323;
  t.dotkatakana = 0x30fb;
  t.dotlessi = 0x0131;
  t.dotlessj = 0xf6be;
  t.dotlessjstrokehook = 0x0284;
  t.dotmath = 0x22c5;
  t.dottedcircle = 0x25cc;
  t.doubleyodpatah = 0xfb1f;
  t.doubleyodpatahhebrew = 0xfb1f;
  t.downtackbelowcmb = 0x031e;
  t.downtackmod = 0x02d5;
  t.dparen = 0x249f;
  t.dsuperior = 0xf6eb;
  t.dtail = 0x0256;
  t.dtopbar = 0x018c;
  t.duhiragana = 0x3065;
  t.dukatakana = 0x30c5;
  t.dz = 0x01f3;
  t.dzaltone = 0x02a3;
  t.dzcaron = 0x01c6;
  t.dzcurl = 0x02a5;
  t.dzeabkhasiancyrillic = 0x04e1;
  t.dzecyrillic = 0x0455;
  t.dzhecyrillic = 0x045f;
  t.e = 0x0065;
  t.eacute = 0x00e9;
  t.earth = 0x2641;
  t.ebengali = 0x098f;
  t.ebopomofo = 0x311c;
  t.ebreve = 0x0115;
  t.ecandradeva = 0x090d;
  t.ecandragujarati = 0x0a8d;
  t.ecandravowelsigndeva = 0x0945;
  t.ecandravowelsigngujarati = 0x0ac5;
  t.ecaron = 0x011b;
  t.ecedillabreve = 0x1e1d;
  t.echarmenian = 0x0565;
  t.echyiwnarmenian = 0x0587;
  t.ecircle = 0x24d4;
  t.ecircumflex = 0x00ea;
  t.ecircumflexacute = 0x1ebf;
  t.ecircumflexbelow = 0x1e19;
  t.ecircumflexdotbelow = 0x1ec7;
  t.ecircumflexgrave = 0x1ec1;
  t.ecircumflexhookabove = 0x1ec3;
  t.ecircumflextilde = 0x1ec5;
  t.ecyrillic = 0x0454;
  t.edblgrave = 0x0205;
  t.edeva = 0x090f;
  t.edieresis = 0x00eb;
  t.edot = 0x0117;
  t.edotaccent = 0x0117;
  t.edotbelow = 0x1eb9;
  t.eegurmukhi = 0x0a0f;
  t.eematragurmukhi = 0x0a47;
  t.efcyrillic = 0x0444;
  t.egrave = 0x00e8;
  t.egujarati = 0x0a8f;
  t.eharmenian = 0x0567;
  t.ehbopomofo = 0x311d;
  t.ehiragana = 0x3048;
  t.ehookabove = 0x1ebb;
  t.eibopomofo = 0x311f;
  t.eight = 0x0038;
  t.eightarabic = 0x0668;
  t.eightbengali = 0x09ee;
  t.eightcircle = 0x2467;
  t.eightcircleinversesansserif = 0x2791;
  t.eightdeva = 0x096e;
  t.eighteencircle = 0x2471;
  t.eighteenparen = 0x2485;
  t.eighteenperiod = 0x2499;
  t.eightgujarati = 0x0aee;
  t.eightgurmukhi = 0x0a6e;
  t.eighthackarabic = 0x0668;
  t.eighthangzhou = 0x3028;
  t.eighthnotebeamed = 0x266b;
  t.eightideographicparen = 0x3227;
  t.eightinferior = 0x2088;
  t.eightmonospace = 0xff18;
  t.eightoldstyle = 0xf738;
  t.eightparen = 0x247b;
  t.eightperiod = 0x248f;
  t.eightpersian = 0x06f8;
  t.eightroman = 0x2177;
  t.eightsuperior = 0x2078;
  t.eightthai = 0x0e58;
  t.einvertedbreve = 0x0207;
  t.eiotifiedcyrillic = 0x0465;
  t.ekatakana = 0x30a8;
  t.ekatakanahalfwidth = 0xff74;
  t.ekonkargurmukhi = 0x0a74;
  t.ekorean = 0x3154;
  t.elcyrillic = 0x043b;
  t.element = 0x2208;
  t.elevencircle = 0x246a;
  t.elevenparen = 0x247e;
  t.elevenperiod = 0x2492;
  t.elevenroman = 0x217a;
  t.ellipsis = 0x2026;
  t.ellipsisvertical = 0x22ee;
  t.emacron = 0x0113;
  t.emacronacute = 0x1e17;
  t.emacrongrave = 0x1e15;
  t.emcyrillic = 0x043c;
  t.emdash = 0x2014;
  t.emdashvertical = 0xfe31;
  t.emonospace = 0xff45;
  t.emphasismarkarmenian = 0x055b;
  t.emptyset = 0x2205;
  t.enbopomofo = 0x3123;
  t.encyrillic = 0x043d;
  t.endash = 0x2013;
  t.endashvertical = 0xfe32;
  t.endescendercyrillic = 0x04a3;
  t.eng = 0x014b;
  t.engbopomofo = 0x3125;
  t.enghecyrillic = 0x04a5;
  t.enhookcyrillic = 0x04c8;
  t.enspace = 0x2002;
  t.eogonek = 0x0119;
  t.eokorean = 0x3153;
  t.eopen = 0x025b;
  t.eopenclosed = 0x029a;
  t.eopenreversed = 0x025c;
  t.eopenreversedclosed = 0x025e;
  t.eopenreversedhook = 0x025d;
  t.eparen = 0x24a0;
  t.epsilon = 0x03b5;
  t.epsilontonos = 0x03ad;
  t.equal = 0x003d;
  t.equalmonospace = 0xff1d;
  t.equalsmall = 0xfe66;
  t.equalsuperior = 0x207c;
  t.equivalence = 0x2261;
  t.erbopomofo = 0x3126;
  t.ercyrillic = 0x0440;
  t.ereversed = 0x0258;
  t.ereversedcyrillic = 0x044d;
  t.escyrillic = 0x0441;
  t.esdescendercyrillic = 0x04ab;
  t.esh = 0x0283;
  t.eshcurl = 0x0286;
  t.eshortdeva = 0x090e;
  t.eshortvowelsigndeva = 0x0946;
  t.eshreversedloop = 0x01aa;
  t.eshsquatreversed = 0x0285;
  t.esmallhiragana = 0x3047;
  t.esmallkatakana = 0x30a7;
  t.esmallkatakanahalfwidth = 0xff6a;
  t.estimated = 0x212e;
  t.esuperior = 0xf6ec;
  t.eta = 0x03b7;
  t.etarmenian = 0x0568;
  t.etatonos = 0x03ae;
  t.eth = 0x00f0;
  t.etilde = 0x1ebd;
  t.etildebelow = 0x1e1b;
  t.etnahtafoukhhebrew = 0x0591;
  t.etnahtafoukhlefthebrew = 0x0591;
  t.etnahtahebrew = 0x0591;
  t.etnahtalefthebrew = 0x0591;
  t.eturned = 0x01dd;
  t.eukorean = 0x3161;
  t.euro = 0x20ac;
  t.evowelsignbengali = 0x09c7;
  t.evowelsigndeva = 0x0947;
  t.evowelsigngujarati = 0x0ac7;
  t.exclam = 0x0021;
  t.exclamarmenian = 0x055c;
  t.exclamdbl = 0x203c;
  t.exclamdown = 0x00a1;
  t.exclamdownsmall = 0xf7a1;
  t.exclammonospace = 0xff01;
  t.exclamsmall = 0xf721;
  t.existential = 0x2203;
  t.ezh = 0x0292;
  t.ezhcaron = 0x01ef;
  t.ezhcurl = 0x0293;
  t.ezhreversed = 0x01b9;
  t.ezhtail = 0x01ba;
  t.f = 0x0066;
  t.fadeva = 0x095e;
  t.fagurmukhi = 0x0a5e;
  t.fahrenheit = 0x2109;
  t.fathaarabic = 0x064e;
  t.fathalowarabic = 0x064e;
  t.fathatanarabic = 0x064b;
  t.fbopomofo = 0x3108;
  t.fcircle = 0x24d5;
  t.fdotaccent = 0x1e1f;
  t.feharabic = 0x0641;
  t.feharmenian = 0x0586;
  t.fehfinalarabic = 0xfed2;
  t.fehinitialarabic = 0xfed3;
  t.fehmedialarabic = 0xfed4;
  t.feicoptic = 0x03e5;
  t.female = 0x2640;
  t.ff = 0xfb00;
  t.f_f = 0xfb00;
  t.ffi = 0xfb03;
  t.f_f_i = 0xfb03;
  t.ffl = 0xfb04;
  t.f_f_l = 0xfb04;
  t.fi = 0xfb01;
  t.f_i = 0xfb01;
  t.fifteencircle = 0x246e;
  t.fifteenparen = 0x2482;
  t.fifteenperiod = 0x2496;
  t.figuredash = 0x2012;
  t.filledbox = 0x25a0;
  t.filledrect = 0x25ac;
  t.finalkaf = 0x05da;
  t.finalkafdagesh = 0xfb3a;
  t.finalkafdageshhebrew = 0xfb3a;
  t.finalkafhebrew = 0x05da;
  t.finalmem = 0x05dd;
  t.finalmemhebrew = 0x05dd;
  t.finalnun = 0x05df;
  t.finalnunhebrew = 0x05df;
  t.finalpe = 0x05e3;
  t.finalpehebrew = 0x05e3;
  t.finaltsadi = 0x05e5;
  t.finaltsadihebrew = 0x05e5;
  t.firsttonechinese = 0x02c9;
  t.fisheye = 0x25c9;
  t.fitacyrillic = 0x0473;
  t.five = 0x0035;
  t.fivearabic = 0x0665;
  t.fivebengali = 0x09eb;
  t.fivecircle = 0x2464;
  t.fivecircleinversesansserif = 0x278e;
  t.fivedeva = 0x096b;
  t.fiveeighths = 0x215d;
  t.fivegujarati = 0x0aeb;
  t.fivegurmukhi = 0x0a6b;
  t.fivehackarabic = 0x0665;
  t.fivehangzhou = 0x3025;
  t.fiveideographicparen = 0x3224;
  t.fiveinferior = 0x2085;
  t.fivemonospace = 0xff15;
  t.fiveoldstyle = 0xf735;
  t.fiveparen = 0x2478;
  t.fiveperiod = 0x248c;
  t.fivepersian = 0x06f5;
  t.fiveroman = 0x2174;
  t.fivesuperior = 0x2075;
  t.fivethai = 0x0e55;
  t.fl = 0xfb02;
  t.f_l = 0xfb02;
  t.florin = 0x0192;
  t.fmonospace = 0xff46;
  t.fmsquare = 0x3399;
  t.fofanthai = 0x0e1f;
  t.fofathai = 0x0e1d;
  t.fongmanthai = 0x0e4f;
  t.forall = 0x2200;
  t.four = 0x0034;
  t.fourarabic = 0x0664;
  t.fourbengali = 0x09ea;
  t.fourcircle = 0x2463;
  t.fourcircleinversesansserif = 0x278d;
  t.fourdeva = 0x096a;
  t.fourgujarati = 0x0aea;
  t.fourgurmukhi = 0x0a6a;
  t.fourhackarabic = 0x0664;
  t.fourhangzhou = 0x3024;
  t.fourideographicparen = 0x3223;
  t.fourinferior = 0x2084;
  t.fourmonospace = 0xff14;
  t.fournumeratorbengali = 0x09f7;
  t.fouroldstyle = 0xf734;
  t.fourparen = 0x2477;
  t.fourperiod = 0x248b;
  t.fourpersian = 0x06f4;
  t.fourroman = 0x2173;
  t.foursuperior = 0x2074;
  t.fourteencircle = 0x246d;
  t.fourteenparen = 0x2481;
  t.fourteenperiod = 0x2495;
  t.fourthai = 0x0e54;
  t.fourthtonechinese = 0x02cb;
  t.fparen = 0x24a1;
  t.fraction = 0x2044;
  t.franc = 0x20a3;
  t.g = 0x0067;
  t.gabengali = 0x0997;
  t.gacute = 0x01f5;
  t.gadeva = 0x0917;
  t.gafarabic = 0x06af;
  t.gaffinalarabic = 0xfb93;
  t.gafinitialarabic = 0xfb94;
  t.gafmedialarabic = 0xfb95;
  t.gagujarati = 0x0a97;
  t.gagurmukhi = 0x0a17;
  t.gahiragana = 0x304c;
  t.gakatakana = 0x30ac;
  t.gamma = 0x03b3;
  t.gammalatinsmall = 0x0263;
  t.gammasuperior = 0x02e0;
  t.gangiacoptic = 0x03eb;
  t.gbopomofo = 0x310d;
  t.gbreve = 0x011f;
  t.gcaron = 0x01e7;
  t.gcedilla = 0x0123;
  t.gcircle = 0x24d6;
  t.gcircumflex = 0x011d;
  t.gcommaaccent = 0x0123;
  t.gdot = 0x0121;
  t.gdotaccent = 0x0121;
  t.gecyrillic = 0x0433;
  t.gehiragana = 0x3052;
  t.gekatakana = 0x30b2;
  t.geometricallyequal = 0x2251;
  t.gereshaccenthebrew = 0x059c;
  t.gereshhebrew = 0x05f3;
  t.gereshmuqdamhebrew = 0x059d;
  t.germandbls = 0x00df;
  t.gershayimaccenthebrew = 0x059e;
  t.gershayimhebrew = 0x05f4;
  t.getamark = 0x3013;
  t.ghabengali = 0x0998;
  t.ghadarmenian = 0x0572;
  t.ghadeva = 0x0918;
  t.ghagujarati = 0x0a98;
  t.ghagurmukhi = 0x0a18;
  t.ghainarabic = 0x063a;
  t.ghainfinalarabic = 0xfece;
  t.ghaininitialarabic = 0xfecf;
  t.ghainmedialarabic = 0xfed0;
  t.ghemiddlehookcyrillic = 0x0495;
  t.ghestrokecyrillic = 0x0493;
  t.gheupturncyrillic = 0x0491;
  t.ghhadeva = 0x095a;
  t.ghhagurmukhi = 0x0a5a;
  t.ghook = 0x0260;
  t.ghzsquare = 0x3393;
  t.gihiragana = 0x304e;
  t.gikatakana = 0x30ae;
  t.gimarmenian = 0x0563;
  t.gimel = 0x05d2;
  t.gimeldagesh = 0xfb32;
  t.gimeldageshhebrew = 0xfb32;
  t.gimelhebrew = 0x05d2;
  t.gjecyrillic = 0x0453;
  t.glottalinvertedstroke = 0x01be;
  t.glottalstop = 0x0294;
  t.glottalstopinverted = 0x0296;
  t.glottalstopmod = 0x02c0;
  t.glottalstopreversed = 0x0295;
  t.glottalstopreversedmod = 0x02c1;
  t.glottalstopreversedsuperior = 0x02e4;
  t.glottalstopstroke = 0x02a1;
  t.glottalstopstrokereversed = 0x02a2;
  t.gmacron = 0x1e21;
  t.gmonospace = 0xff47;
  t.gohiragana = 0x3054;
  t.gokatakana = 0x30b4;
  t.gparen = 0x24a2;
  t.gpasquare = 0x33ac;
  t.gradient = 0x2207;
  t.grave = 0x0060;
  t.gravebelowcmb = 0x0316;
  t.gravecmb = 0x0300;
  t.gravecomb = 0x0300;
  t.gravedeva = 0x0953;
  t.gravelowmod = 0x02ce;
  t.gravemonospace = 0xff40;
  t.gravetonecmb = 0x0340;
  t.greater = 0x003e;
  t.greaterequal = 0x2265;
  t.greaterequalorless = 0x22db;
  t.greatermonospace = 0xff1e;
  t.greaterorequivalent = 0x2273;
  t.greaterorless = 0x2277;
  t.greateroverequal = 0x2267;
  t.greatersmall = 0xfe65;
  t.gscript = 0x0261;
  t.gstroke = 0x01e5;
  t.guhiragana = 0x3050;
  t.guillemotleft = 0x00ab;
  t.guillemotright = 0x00bb;
  t.guilsinglleft = 0x2039;
  t.guilsinglright = 0x203a;
  t.gukatakana = 0x30b0;
  t.guramusquare = 0x3318;
  t.gysquare = 0x33c9;
  t.h = 0x0068;
  t.haabkhasiancyrillic = 0x04a9;
  t.haaltonearabic = 0x06c1;
  t.habengali = 0x09b9;
  t.hadescendercyrillic = 0x04b3;
  t.hadeva = 0x0939;
  t.hagujarati = 0x0ab9;
  t.hagurmukhi = 0x0a39;
  t.haharabic = 0x062d;
  t.hahfinalarabic = 0xfea2;
  t.hahinitialarabic = 0xfea3;
  t.hahiragana = 0x306f;
  t.hahmedialarabic = 0xfea4;
  t.haitusquare = 0x332a;
  t.hakatakana = 0x30cf;
  t.hakatakanahalfwidth = 0xff8a;
  t.halantgurmukhi = 0x0a4d;
  t.hamzaarabic = 0x0621;
  t.hamzalowarabic = 0x0621;
  t.hangulfiller = 0x3164;
  t.hardsigncyrillic = 0x044a;
  t.harpoonleftbarbup = 0x21bc;
  t.harpoonrightbarbup = 0x21c0;
  t.hasquare = 0x33ca;
  t.hatafpatah = 0x05b2;
  t.hatafpatah16 = 0x05b2;
  t.hatafpatah23 = 0x05b2;
  t.hatafpatah2f = 0x05b2;
  t.hatafpatahhebrew = 0x05b2;
  t.hatafpatahnarrowhebrew = 0x05b2;
  t.hatafpatahquarterhebrew = 0x05b2;
  t.hatafpatahwidehebrew = 0x05b2;
  t.hatafqamats = 0x05b3;
  t.hatafqamats1b = 0x05b3;
  t.hatafqamats28 = 0x05b3;
  t.hatafqamats34 = 0x05b3;
  t.hatafqamatshebrew = 0x05b3;
  t.hatafqamatsnarrowhebrew = 0x05b3;
  t.hatafqamatsquarterhebrew = 0x05b3;
  t.hatafqamatswidehebrew = 0x05b3;
  t.hatafsegol = 0x05b1;
  t.hatafsegol17 = 0x05b1;
  t.hatafsegol24 = 0x05b1;
  t.hatafsegol30 = 0x05b1;
  t.hatafsegolhebrew = 0x05b1;
  t.hatafsegolnarrowhebrew = 0x05b1;
  t.hatafsegolquarterhebrew = 0x05b1;
  t.hatafsegolwidehebrew = 0x05b1;
  t.hbar = 0x0127;
  t.hbopomofo = 0x310f;
  t.hbrevebelow = 0x1e2b;
  t.hcedilla = 0x1e29;
  t.hcircle = 0x24d7;
  t.hcircumflex = 0x0125;
  t.hdieresis = 0x1e27;
  t.hdotaccent = 0x1e23;
  t.hdotbelow = 0x1e25;
  t.he = 0x05d4;
  t.heart = 0x2665;
  t.heartsuitblack = 0x2665;
  t.heartsuitwhite = 0x2661;
  t.hedagesh = 0xfb34;
  t.hedageshhebrew = 0xfb34;
  t.hehaltonearabic = 0x06c1;
  t.heharabic = 0x0647;
  t.hehebrew = 0x05d4;
  t.hehfinalaltonearabic = 0xfba7;
  t.hehfinalalttwoarabic = 0xfeea;
  t.hehfinalarabic = 0xfeea;
  t.hehhamzaabovefinalarabic = 0xfba5;
  t.hehhamzaaboveisolatedarabic = 0xfba4;
  t.hehinitialaltonearabic = 0xfba8;
  t.hehinitialarabic = 0xfeeb;
  t.hehiragana = 0x3078;
  t.hehmedialaltonearabic = 0xfba9;
  t.hehmedialarabic = 0xfeec;
  t.heiseierasquare = 0x337b;
  t.hekatakana = 0x30d8;
  t.hekatakanahalfwidth = 0xff8d;
  t.hekutaarusquare = 0x3336;
  t.henghook = 0x0267;
  t.herutusquare = 0x3339;
  t.het = 0x05d7;
  t.hethebrew = 0x05d7;
  t.hhook = 0x0266;
  t.hhooksuperior = 0x02b1;
  t.hieuhacirclekorean = 0x327b;
  t.hieuhaparenkorean = 0x321b;
  t.hieuhcirclekorean = 0x326d;
  t.hieuhkorean = 0x314e;
  t.hieuhparenkorean = 0x320d;
  t.hihiragana = 0x3072;
  t.hikatakana = 0x30d2;
  t.hikatakanahalfwidth = 0xff8b;
  t.hiriq = 0x05b4;
  t.hiriq14 = 0x05b4;
  t.hiriq21 = 0x05b4;
  t.hiriq2d = 0x05b4;
  t.hiriqhebrew = 0x05b4;
  t.hiriqnarrowhebrew = 0x05b4;
  t.hiriqquarterhebrew = 0x05b4;
  t.hiriqwidehebrew = 0x05b4;
  t.hlinebelow = 0x1e96;
  t.hmonospace = 0xff48;
  t.hoarmenian = 0x0570;
  t.hohipthai = 0x0e2b;
  t.hohiragana = 0x307b;
  t.hokatakana = 0x30db;
  t.hokatakanahalfwidth = 0xff8e;
  t.holam = 0x05b9;
  t.holam19 = 0x05b9;
  t.holam26 = 0x05b9;
  t.holam32 = 0x05b9;
  t.holamhebrew = 0x05b9;
  t.holamnarrowhebrew = 0x05b9;
  t.holamquarterhebrew = 0x05b9;
  t.holamwidehebrew = 0x05b9;
  t.honokhukthai = 0x0e2e;
  t.hookabovecomb = 0x0309;
  t.hookcmb = 0x0309;
  t.hookpalatalizedbelowcmb = 0x0321;
  t.hookretroflexbelowcmb = 0x0322;
  t.hoonsquare = 0x3342;
  t.horicoptic = 0x03e9;
  t.horizontalbar = 0x2015;
  t.horncmb = 0x031b;
  t.hotsprings = 0x2668;
  t.house = 0x2302;
  t.hparen = 0x24a3;
  t.hsuperior = 0x02b0;
  t.hturned = 0x0265;
  t.huhiragana = 0x3075;
  t.huiitosquare = 0x3333;
  t.hukatakana = 0x30d5;
  t.hukatakanahalfwidth = 0xff8c;
  t.hungarumlaut = 0x02dd;
  t.hungarumlautcmb = 0x030b;
  t.hv = 0x0195;
  t.hyphen = 0x002d;
  t.hypheninferior = 0xf6e5;
  t.hyphenmonospace = 0xff0d;
  t.hyphensmall = 0xfe63;
  t.hyphensuperior = 0xf6e6;
  t.hyphentwo = 0x2010;
  t.i = 0x0069;
  t.iacute = 0x00ed;
  t.iacyrillic = 0x044f;
  t.ibengali = 0x0987;
  t.ibopomofo = 0x3127;
  t.ibreve = 0x012d;
  t.icaron = 0x01d0;
  t.icircle = 0x24d8;
  t.icircumflex = 0x00ee;
  t.icyrillic = 0x0456;
  t.idblgrave = 0x0209;
  t.ideographearthcircle = 0x328f;
  t.ideographfirecircle = 0x328b;
  t.ideographicallianceparen = 0x323f;
  t.ideographiccallparen = 0x323a;
  t.ideographiccentrecircle = 0x32a5;
  t.ideographicclose = 0x3006;
  t.ideographiccomma = 0x3001;
  t.ideographiccommaleft = 0xff64;
  t.ideographiccongratulationparen = 0x3237;
  t.ideographiccorrectcircle = 0x32a3;
  t.ideographicearthparen = 0x322f;
  t.ideographicenterpriseparen = 0x323d;
  t.ideographicexcellentcircle = 0x329d;
  t.ideographicfestivalparen = 0x3240;
  t.ideographicfinancialcircle = 0x3296;
  t.ideographicfinancialparen = 0x3236;
  t.ideographicfireparen = 0x322b;
  t.ideographichaveparen = 0x3232;
  t.ideographichighcircle = 0x32a4;
  t.ideographiciterationmark = 0x3005;
  t.ideographiclaborcircle = 0x3298;
  t.ideographiclaborparen = 0x3238;
  t.ideographicleftcircle = 0x32a7;
  t.ideographiclowcircle = 0x32a6;
  t.ideographicmedicinecircle = 0x32a9;
  t.ideographicmetalparen = 0x322e;
  t.ideographicmoonparen = 0x322a;
  t.ideographicnameparen = 0x3234;
  t.ideographicperiod = 0x3002;
  t.ideographicprintcircle = 0x329e;
  t.ideographicreachparen = 0x3243;
  t.ideographicrepresentparen = 0x3239;
  t.ideographicresourceparen = 0x323e;
  t.ideographicrightcircle = 0x32a8;
  t.ideographicsecretcircle = 0x3299;
  t.ideographicselfparen = 0x3242;
  t.ideographicsocietyparen = 0x3233;
  t.ideographicspace = 0x3000;
  t.ideographicspecialparen = 0x3235;
  t.ideographicstockparen = 0x3231;
  t.ideographicstudyparen = 0x323b;
  t.ideographicsunparen = 0x3230;
  t.ideographicsuperviseparen = 0x323c;
  t.ideographicwaterparen = 0x322c;
  t.ideographicwoodparen = 0x322d;
  t.ideographiczero = 0x3007;
  t.ideographmetalcircle = 0x328e;
  t.ideographmooncircle = 0x328a;
  t.ideographnamecircle = 0x3294;
  t.ideographsuncircle = 0x3290;
  t.ideographwatercircle = 0x328c;
  t.ideographwoodcircle = 0x328d;
  t.ideva = 0x0907;
  t.idieresis = 0x00ef;
  t.idieresisacute = 0x1e2f;
  t.idieresiscyrillic = 0x04e5;
  t.idotbelow = 0x1ecb;
  t.iebrevecyrillic = 0x04d7;
  t.iecyrillic = 0x0435;
  t.ieungacirclekorean = 0x3275;
  t.ieungaparenkorean = 0x3215;
  t.ieungcirclekorean = 0x3267;
  t.ieungkorean = 0x3147;
  t.ieungparenkorean = 0x3207;
  t.igrave = 0x00ec;
  t.igujarati = 0x0a87;
  t.igurmukhi = 0x0a07;
  t.ihiragana = 0x3044;
  t.ihookabove = 0x1ec9;
  t.iibengali = 0x0988;
  t.iicyrillic = 0x0438;
  t.iideva = 0x0908;
  t.iigujarati = 0x0a88;
  t.iigurmukhi = 0x0a08;
  t.iimatragurmukhi = 0x0a40;
  t.iinvertedbreve = 0x020b;
  t.iishortcyrillic = 0x0439;
  t.iivowelsignbengali = 0x09c0;
  t.iivowelsigndeva = 0x0940;
  t.iivowelsigngujarati = 0x0ac0;
  t.ij = 0x0133;
  t.ikatakana = 0x30a4;
  t.ikatakanahalfwidth = 0xff72;
  t.ikorean = 0x3163;
  t.ilde = 0x02dc;
  t.iluyhebrew = 0x05ac;
  t.imacron = 0x012b;
  t.imacroncyrillic = 0x04e3;
  t.imageorapproximatelyequal = 0x2253;
  t.imatragurmukhi = 0x0a3f;
  t.imonospace = 0xff49;
  t.increment = 0x2206;
  t.infinity = 0x221e;
  t.iniarmenian = 0x056b;
  t.integral = 0x222b;
  t.integralbottom = 0x2321;
  t.integralbt = 0x2321;
  t.integralex = 0xf8f5;
  t.integraltop = 0x2320;
  t.integraltp = 0x2320;
  t.intersection = 0x2229;
  t.intisquare = 0x3305;
  t.invbullet = 0x25d8;
  t.invcircle = 0x25d9;
  t.invsmileface = 0x263b;
  t.iocyrillic = 0x0451;
  t.iogonek = 0x012f;
  t.iota = 0x03b9;
  t.iotadieresis = 0x03ca;
  t.iotadieresistonos = 0x0390;
  t.iotalatin = 0x0269;
  t.iotatonos = 0x03af;
  t.iparen = 0x24a4;
  t.irigurmukhi = 0x0a72;
  t.ismallhiragana = 0x3043;
  t.ismallkatakana = 0x30a3;
  t.ismallkatakanahalfwidth = 0xff68;
  t.issharbengali = 0x09fa;
  t.istroke = 0x0268;
  t.isuperior = 0xf6ed;
  t.iterationhiragana = 0x309d;
  t.iterationkatakana = 0x30fd;
  t.itilde = 0x0129;
  t.itildebelow = 0x1e2d;
  t.iubopomofo = 0x3129;
  t.iucyrillic = 0x044e;
  t.ivowelsignbengali = 0x09bf;
  t.ivowelsigndeva = 0x093f;
  t.ivowelsigngujarati = 0x0abf;
  t.izhitsacyrillic = 0x0475;
  t.izhitsadblgravecyrillic = 0x0477;
  t.j = 0x006a;
  t.jaarmenian = 0x0571;
  t.jabengali = 0x099c;
  t.jadeva = 0x091c;
  t.jagujarati = 0x0a9c;
  t.jagurmukhi = 0x0a1c;
  t.jbopomofo = 0x3110;
  t.jcaron = 0x01f0;
  t.jcircle = 0x24d9;
  t.jcircumflex = 0x0135;
  t.jcrossedtail = 0x029d;
  t.jdotlessstroke = 0x025f;
  t.jecyrillic = 0x0458;
  t.jeemarabic = 0x062c;
  t.jeemfinalarabic = 0xfe9e;
  t.jeeminitialarabic = 0xfe9f;
  t.jeemmedialarabic = 0xfea0;
  t.jeharabic = 0x0698;
  t.jehfinalarabic = 0xfb8b;
  t.jhabengali = 0x099d;
  t.jhadeva = 0x091d;
  t.jhagujarati = 0x0a9d;
  t.jhagurmukhi = 0x0a1d;
  t.jheharmenian = 0x057b;
  t.jis = 0x3004;
  t.jmonospace = 0xff4a;
  t.jparen = 0x24a5;
  t.jsuperior = 0x02b2;
  t.k = 0x006b;
  t.kabashkircyrillic = 0x04a1;
  t.kabengali = 0x0995;
  t.kacute = 0x1e31;
  t.kacyrillic = 0x043a;
  t.kadescendercyrillic = 0x049b;
  t.kadeva = 0x0915;
  t.kaf = 0x05db;
  t.kafarabic = 0x0643;
  t.kafdagesh = 0xfb3b;
  t.kafdageshhebrew = 0xfb3b;
  t.kaffinalarabic = 0xfeda;
  t.kafhebrew = 0x05db;
  t.kafinitialarabic = 0xfedb;
  t.kafmedialarabic = 0xfedc;
  t.kafrafehebrew = 0xfb4d;
  t.kagujarati = 0x0a95;
  t.kagurmukhi = 0x0a15;
  t.kahiragana = 0x304b;
  t.kahookcyrillic = 0x04c4;
  t.kakatakana = 0x30ab;
  t.kakatakanahalfwidth = 0xff76;
  t.kappa = 0x03ba;
  t.kappasymbolgreek = 0x03f0;
  t.kapyeounmieumkorean = 0x3171;
  t.kapyeounphieuphkorean = 0x3184;
  t.kapyeounpieupkorean = 0x3178;
  t.kapyeounssangpieupkorean = 0x3179;
  t.karoriisquare = 0x330d;
  t.kashidaautoarabic = 0x0640;
  t.kashidaautonosidebearingarabic = 0x0640;
  t.kasmallkatakana = 0x30f5;
  t.kasquare = 0x3384;
  t.kasraarabic = 0x0650;
  t.kasratanarabic = 0x064d;
  t.kastrokecyrillic = 0x049f;
  t.katahiraprolongmarkhalfwidth = 0xff70;
  t.kaverticalstrokecyrillic = 0x049d;
  t.kbopomofo = 0x310e;
  t.kcalsquare = 0x3389;
  t.kcaron = 0x01e9;
  t.kcedilla = 0x0137;
  t.kcircle = 0x24da;
  t.kcommaaccent = 0x0137;
  t.kdotbelow = 0x1e33;
  t.keharmenian = 0x0584;
  t.kehiragana = 0x3051;
  t.kekatakana = 0x30b1;
  t.kekatakanahalfwidth = 0xff79;
  t.kenarmenian = 0x056f;
  t.kesmallkatakana = 0x30f6;
  t.kgreenlandic = 0x0138;
  t.khabengali = 0x0996;
  t.khacyrillic = 0x0445;
  t.khadeva = 0x0916;
  t.khagujarati = 0x0a96;
  t.khagurmukhi = 0x0a16;
  t.khaharabic = 0x062e;
  t.khahfinalarabic = 0xfea6;
  t.khahinitialarabic = 0xfea7;
  t.khahmedialarabic = 0xfea8;
  t.kheicoptic = 0x03e7;
  t.khhadeva = 0x0959;
  t.khhagurmukhi = 0x0a59;
  t.khieukhacirclekorean = 0x3278;
  t.khieukhaparenkorean = 0x3218;
  t.khieukhcirclekorean = 0x326a;
  t.khieukhkorean = 0x314b;
  t.khieukhparenkorean = 0x320a;
  t.khokhaithai = 0x0e02;
  t.khokhonthai = 0x0e05;
  t.khokhuatthai = 0x0e03;
  t.khokhwaithai = 0x0e04;
  t.khomutthai = 0x0e5b;
  t.khook = 0x0199;
  t.khorakhangthai = 0x0e06;
  t.khzsquare = 0x3391;
  t.kihiragana = 0x304d;
  t.kikatakana = 0x30ad;
  t.kikatakanahalfwidth = 0xff77;
  t.kiroguramusquare = 0x3315;
  t.kiromeetorusquare = 0x3316;
  t.kirosquare = 0x3314;
  t.kiyeokacirclekorean = 0x326e;
  t.kiyeokaparenkorean = 0x320e;
  t.kiyeokcirclekorean = 0x3260;
  t.kiyeokkorean = 0x3131;
  t.kiyeokparenkorean = 0x3200;
  t.kiyeoksioskorean = 0x3133;
  t.kjecyrillic = 0x045c;
  t.klinebelow = 0x1e35;
  t.klsquare = 0x3398;
  t.kmcubedsquare = 0x33a6;
  t.kmonospace = 0xff4b;
  t.kmsquaredsquare = 0x33a2;
  t.kohiragana = 0x3053;
  t.kohmsquare = 0x33c0;
  t.kokaithai = 0x0e01;
  t.kokatakana = 0x30b3;
  t.kokatakanahalfwidth = 0xff7a;
  t.kooposquare = 0x331e;
  t.koppacyrillic = 0x0481;
  t.koreanstandardsymbol = 0x327f;
  t.koroniscmb = 0x0343;
  t.kparen = 0x24a6;
  t.kpasquare = 0x33aa;
  t.ksicyrillic = 0x046f;
  t.ktsquare = 0x33cf;
  t.kturned = 0x029e;
  t.kuhiragana = 0x304f;
  t.kukatakana = 0x30af;
  t.kukatakanahalfwidth = 0xff78;
  t.kvsquare = 0x33b8;
  t.kwsquare = 0x33be;
  t.l = 0x006c;
  t.labengali = 0x09b2;
  t.lacute = 0x013a;
  t.ladeva = 0x0932;
  t.lagujarati = 0x0ab2;
  t.lagurmukhi = 0x0a32;
  t.lakkhangyaothai = 0x0e45;
  t.lamaleffinalarabic = 0xfefc;
  t.lamalefhamzaabovefinalarabic = 0xfef8;
  t.lamalefhamzaaboveisolatedarabic = 0xfef7;
  t.lamalefhamzabelowfinalarabic = 0xfefa;
  t.lamalefhamzabelowisolatedarabic = 0xfef9;
  t.lamalefisolatedarabic = 0xfefb;
  t.lamalefmaddaabovefinalarabic = 0xfef6;
  t.lamalefmaddaaboveisolatedarabic = 0xfef5;
  t.lamarabic = 0x0644;
  t.lambda = 0x03bb;
  t.lambdastroke = 0x019b;
  t.lamed = 0x05dc;
  t.lameddagesh = 0xfb3c;
  t.lameddageshhebrew = 0xfb3c;
  t.lamedhebrew = 0x05dc;
  t.lamfinalarabic = 0xfede;
  t.lamhahinitialarabic = 0xfcca;
  t.laminitialarabic = 0xfedf;
  t.lamjeeminitialarabic = 0xfcc9;
  t.lamkhahinitialarabic = 0xfccb;
  t.lamlamhehisolatedarabic = 0xfdf2;
  t.lammedialarabic = 0xfee0;
  t.lammeemhahinitialarabic = 0xfd88;
  t.lammeeminitialarabic = 0xfccc;
  t.largecircle = 0x25ef;
  t.lbar = 0x019a;
  t.lbelt = 0x026c;
  t.lbopomofo = 0x310c;
  t.lcaron = 0x013e;
  t.lcedilla = 0x013c;
  t.lcircle = 0x24db;
  t.lcircumflexbelow = 0x1e3d;
  t.lcommaaccent = 0x013c;
  t.ldot = 0x0140;
  t.ldotaccent = 0x0140;
  t.ldotbelow = 0x1e37;
  t.ldotbelowmacron = 0x1e39;
  t.leftangleabovecmb = 0x031a;
  t.lefttackbelowcmb = 0x0318;
  t.less = 0x003c;
  t.lessequal = 0x2264;
  t.lessequalorgreater = 0x22da;
  t.lessmonospace = 0xff1c;
  t.lessorequivalent = 0x2272;
  t.lessorgreater = 0x2276;
  t.lessoverequal = 0x2266;
  t.lesssmall = 0xfe64;
  t.lezh = 0x026e;
  t.lfblock = 0x258c;
  t.lhookretroflex = 0x026d;
  t.lira = 0x20a4;
  t.liwnarmenian = 0x056c;
  t.lj = 0x01c9;
  t.ljecyrillic = 0x0459;
  t.ll = 0xf6c0;
  t.lladeva = 0x0933;
  t.llagujarati = 0x0ab3;
  t.llinebelow = 0x1e3b;
  t.llladeva = 0x0934;
  t.llvocalicbengali = 0x09e1;
  t.llvocalicdeva = 0x0961;
  t.llvocalicvowelsignbengali = 0x09e3;
  t.llvocalicvowelsigndeva = 0x0963;
  t.lmiddletilde = 0x026b;
  t.lmonospace = 0xff4c;
  t.lmsquare = 0x33d0;
  t.lochulathai = 0x0e2c;
  t.logicaland = 0x2227;
  t.logicalnot = 0x00ac;
  t.logicalnotreversed = 0x2310;
  t.logicalor = 0x2228;
  t.lolingthai = 0x0e25;
  t.longs = 0x017f;
  t.lowlinecenterline = 0xfe4e;
  t.lowlinecmb = 0x0332;
  t.lowlinedashed = 0xfe4d;
  t.lozenge = 0x25ca;
  t.lparen = 0x24a7;
  t.lslash = 0x0142;
  t.lsquare = 0x2113;
  t.lsuperior = 0xf6ee;
  t.ltshade = 0x2591;
  t.luthai = 0x0e26;
  t.lvocalicbengali = 0x098c;
  t.lvocalicdeva = 0x090c;
  t.lvocalicvowelsignbengali = 0x09e2;
  t.lvocalicvowelsigndeva = 0x0962;
  t.lxsquare = 0x33d3;
  t.m = 0x006d;
  t.mabengali = 0x09ae;
  t.macron = 0x00af;
  t.macronbelowcmb = 0x0331;
  t.macroncmb = 0x0304;
  t.macronlowmod = 0x02cd;
  t.macronmonospace = 0xffe3;
  t.macute = 0x1e3f;
  t.madeva = 0x092e;
  t.magujarati = 0x0aae;
  t.magurmukhi = 0x0a2e;
  t.mahapakhhebrew = 0x05a4;
  t.mahapakhlefthebrew = 0x05a4;
  t.mahiragana = 0x307e;
  t.maichattawalowleftthai = 0xf895;
  t.maichattawalowrightthai = 0xf894;
  t.maichattawathai = 0x0e4b;
  t.maichattawaupperleftthai = 0xf893;
  t.maieklowleftthai = 0xf88c;
  t.maieklowrightthai = 0xf88b;
  t.maiekthai = 0x0e48;
  t.maiekupperleftthai = 0xf88a;
  t.maihanakatleftthai = 0xf884;
  t.maihanakatthai = 0x0e31;
  t.maitaikhuleftthai = 0xf889;
  t.maitaikhuthai = 0x0e47;
  t.maitholowleftthai = 0xf88f;
  t.maitholowrightthai = 0xf88e;
  t.maithothai = 0x0e49;
  t.maithoupperleftthai = 0xf88d;
  t.maitrilowleftthai = 0xf892;
  t.maitrilowrightthai = 0xf891;
  t.maitrithai = 0x0e4a;
  t.maitriupperleftthai = 0xf890;
  t.maiyamokthai = 0x0e46;
  t.makatakana = 0x30de;
  t.makatakanahalfwidth = 0xff8f;
  t.male = 0x2642;
  t.mansyonsquare = 0x3347;
  t.maqafhebrew = 0x05be;
  t.mars = 0x2642;
  t.masoracirclehebrew = 0x05af;
  t.masquare = 0x3383;
  t.mbopomofo = 0x3107;
  t.mbsquare = 0x33d4;
  t.mcircle = 0x24dc;
  t.mcubedsquare = 0x33a5;
  t.mdotaccent = 0x1e41;
  t.mdotbelow = 0x1e43;
  t.meemarabic = 0x0645;
  t.meemfinalarabic = 0xfee2;
  t.meeminitialarabic = 0xfee3;
  t.meemmedialarabic = 0xfee4;
  t.meemmeeminitialarabic = 0xfcd1;
  t.meemmeemisolatedarabic = 0xfc48;
  t.meetorusquare = 0x334d;
  t.mehiragana = 0x3081;
  t.meizierasquare = 0x337e;
  t.mekatakana = 0x30e1;
  t.mekatakanahalfwidth = 0xff92;
  t.mem = 0x05de;
  t.memdagesh = 0xfb3e;
  t.memdageshhebrew = 0xfb3e;
  t.memhebrew = 0x05de;
  t.menarmenian = 0x0574;
  t.merkhahebrew = 0x05a5;
  t.merkhakefulahebrew = 0x05a6;
  t.merkhakefulalefthebrew = 0x05a6;
  t.merkhalefthebrew = 0x05a5;
  t.mhook = 0x0271;
  t.mhzsquare = 0x3392;
  t.middledotkatakanahalfwidth = 0xff65;
  t.middot = 0x00b7;
  t.mieumacirclekorean = 0x3272;
  t.mieumaparenkorean = 0x3212;
  t.mieumcirclekorean = 0x3264;
  t.mieumkorean = 0x3141;
  t.mieumpansioskorean = 0x3170;
  t.mieumparenkorean = 0x3204;
  t.mieumpieupkorean = 0x316e;
  t.mieumsioskorean = 0x316f;
  t.mihiragana = 0x307f;
  t.mikatakana = 0x30df;
  t.mikatakanahalfwidth = 0xff90;
  t.minus = 0x2212;
  t.minusbelowcmb = 0x0320;
  t.minuscircle = 0x2296;
  t.minusmod = 0x02d7;
  t.minusplus = 0x2213;
  t.minute = 0x2032;
  t.miribaarusquare = 0x334a;
  t.mirisquare = 0x3349;
  t.mlonglegturned = 0x0270;
  t.mlsquare = 0x3396;
  t.mmcubedsquare = 0x33a3;
  t.mmonospace = 0xff4d;
  t.mmsquaredsquare = 0x339f;
  t.mohiragana = 0x3082;
  t.mohmsquare = 0x33c1;
  t.mokatakana = 0x30e2;
  t.mokatakanahalfwidth = 0xff93;
  t.molsquare = 0x33d6;
  t.momathai = 0x0e21;
  t.moverssquare = 0x33a7;
  t.moverssquaredsquare = 0x33a8;
  t.mparen = 0x24a8;
  t.mpasquare = 0x33ab;
  t.mssquare = 0x33b3;
  t.msuperior = 0xf6ef;
  t.mturned = 0x026f;
  t.mu = 0x00b5;
  t.mu1 = 0x00b5;
  t.muasquare = 0x3382;
  t.muchgreater = 0x226b;
  t.muchless = 0x226a;
  t.mufsquare = 0x338c;
  t.mugreek = 0x03bc;
  t.mugsquare = 0x338d;
  t.muhiragana = 0x3080;
  t.mukatakana = 0x30e0;
  t.mukatakanahalfwidth = 0xff91;
  t.mulsquare = 0x3395;
  t.multiply = 0x00d7;
  t.mumsquare = 0x339b;
  t.munahhebrew = 0x05a3;
  t.munahlefthebrew = 0x05a3;
  t.musicalnote = 0x266a;
  t.musicalnotedbl = 0x266b;
  t.musicflatsign = 0x266d;
  t.musicsharpsign = 0x266f;
  t.mussquare = 0x33b2;
  t.muvsquare = 0x33b6;
  t.muwsquare = 0x33bc;
  t.mvmegasquare = 0x33b9;
  t.mvsquare = 0x33b7;
  t.mwmegasquare = 0x33bf;
  t.mwsquare = 0x33bd;
  t.n = 0x006e;
  t.nabengali = 0x09a8;
  t.nabla = 0x2207;
  t.nacute = 0x0144;
  t.nadeva = 0x0928;
  t.nagujarati = 0x0aa8;
  t.nagurmukhi = 0x0a28;
  t.nahiragana = 0x306a;
  t.nakatakana = 0x30ca;
  t.nakatakanahalfwidth = 0xff85;
  t.napostrophe = 0x0149;
  t.nasquare = 0x3381;
  t.nbopomofo = 0x310b;
  t.nbspace = 0x00a0;
  t.ncaron = 0x0148;
  t.ncedilla = 0x0146;
  t.ncircle = 0x24dd;
  t.ncircumflexbelow = 0x1e4b;
  t.ncommaaccent = 0x0146;
  t.ndotaccent = 0x1e45;
  t.ndotbelow = 0x1e47;
  t.nehiragana = 0x306d;
  t.nekatakana = 0x30cd;
  t.nekatakanahalfwidth = 0xff88;
  t.newsheqelsign = 0x20aa;
  t.nfsquare = 0x338b;
  t.ngabengali = 0x0999;
  t.ngadeva = 0x0919;
  t.ngagujarati = 0x0a99;
  t.ngagurmukhi = 0x0a19;
  t.ngonguthai = 0x0e07;
  t.nhiragana = 0x3093;
  t.nhookleft = 0x0272;
  t.nhookretroflex = 0x0273;
  t.nieunacirclekorean = 0x326f;
  t.nieunaparenkorean = 0x320f;
  t.nieuncieuckorean = 0x3135;
  t.nieuncirclekorean = 0x3261;
  t.nieunhieuhkorean = 0x3136;
  t.nieunkorean = 0x3134;
  t.nieunpansioskorean = 0x3168;
  t.nieunparenkorean = 0x3201;
  t.nieunsioskorean = 0x3167;
  t.nieuntikeutkorean = 0x3166;
  t.nihiragana = 0x306b;
  t.nikatakana = 0x30cb;
  t.nikatakanahalfwidth = 0xff86;
  t.nikhahitleftthai = 0xf899;
  t.nikhahitthai = 0x0e4d;
  t.nine = 0x0039;
  t.ninearabic = 0x0669;
  t.ninebengali = 0x09ef;
  t.ninecircle = 0x2468;
  t.ninecircleinversesansserif = 0x2792;
  t.ninedeva = 0x096f;
  t.ninegujarati = 0x0aef;
  t.ninegurmukhi = 0x0a6f;
  t.ninehackarabic = 0x0669;
  t.ninehangzhou = 0x3029;
  t.nineideographicparen = 0x3228;
  t.nineinferior = 0x2089;
  t.ninemonospace = 0xff19;
  t.nineoldstyle = 0xf739;
  t.nineparen = 0x247c;
  t.nineperiod = 0x2490;
  t.ninepersian = 0x06f9;
  t.nineroman = 0x2178;
  t.ninesuperior = 0x2079;
  t.nineteencircle = 0x2472;
  t.nineteenparen = 0x2486;
  t.nineteenperiod = 0x249a;
  t.ninethai = 0x0e59;
  t.nj = 0x01cc;
  t.njecyrillic = 0x045a;
  t.nkatakana = 0x30f3;
  t.nkatakanahalfwidth = 0xff9d;
  t.nlegrightlong = 0x019e;
  t.nlinebelow = 0x1e49;
  t.nmonospace = 0xff4e;
  t.nmsquare = 0x339a;
  t.nnabengali = 0x09a3;
  t.nnadeva = 0x0923;
  t.nnagujarati = 0x0aa3;
  t.nnagurmukhi = 0x0a23;
  t.nnnadeva = 0x0929;
  t.nohiragana = 0x306e;
  t.nokatakana = 0x30ce;
  t.nokatakanahalfwidth = 0xff89;
  t.nonbreakingspace = 0x00a0;
  t.nonenthai = 0x0e13;
  t.nonuthai = 0x0e19;
  t.noonarabic = 0x0646;
  t.noonfinalarabic = 0xfee6;
  t.noonghunnaarabic = 0x06ba;
  t.noonghunnafinalarabic = 0xfb9f;
  t.nooninitialarabic = 0xfee7;
  t.noonjeeminitialarabic = 0xfcd2;
  t.noonjeemisolatedarabic = 0xfc4b;
  t.noonmedialarabic = 0xfee8;
  t.noonmeeminitialarabic = 0xfcd5;
  t.noonmeemisolatedarabic = 0xfc4e;
  t.noonnoonfinalarabic = 0xfc8d;
  t.notcontains = 0x220c;
  t.notelement = 0x2209;
  t.notelementof = 0x2209;
  t.notequal = 0x2260;
  t.notgreater = 0x226f;
  t.notgreaternorequal = 0x2271;
  t.notgreaternorless = 0x2279;
  t.notidentical = 0x2262;
  t.notless = 0x226e;
  t.notlessnorequal = 0x2270;
  t.notparallel = 0x2226;
  t.notprecedes = 0x2280;
  t.notsubset = 0x2284;
  t.notsucceeds = 0x2281;
  t.notsuperset = 0x2285;
  t.nowarmenian = 0x0576;
  t.nparen = 0x24a9;
  t.nssquare = 0x33b1;
  t.nsuperior = 0x207f;
  t.ntilde = 0x00f1;
  t.nu = 0x03bd;
  t.nuhiragana = 0x306c;
  t.nukatakana = 0x30cc;
  t.nukatakanahalfwidth = 0xff87;
  t.nuktabengali = 0x09bc;
  t.nuktadeva = 0x093c;
  t.nuktagujarati = 0x0abc;
  t.nuktagurmukhi = 0x0a3c;
  t.numbersign = 0x0023;
  t.numbersignmonospace = 0xff03;
  t.numbersignsmall = 0xfe5f;
  t.numeralsigngreek = 0x0374;
  t.numeralsignlowergreek = 0x0375;
  t.numero = 0x2116;
  t.nun = 0x05e0;
  t.nundagesh = 0xfb40;
  t.nundageshhebrew = 0xfb40;
  t.nunhebrew = 0x05e0;
  t.nvsquare = 0x33b5;
  t.nwsquare = 0x33bb;
  t.nyabengali = 0x099e;
  t.nyadeva = 0x091e;
  t.nyagujarati = 0x0a9e;
  t.nyagurmukhi = 0x0a1e;
  t.o = 0x006f;
  t.oacute = 0x00f3;
  t.oangthai = 0x0e2d;
  t.obarred = 0x0275;
  t.obarredcyrillic = 0x04e9;
  t.obarreddieresiscyrillic = 0x04eb;
  t.obengali = 0x0993;
  t.obopomofo = 0x311b;
  t.obreve = 0x014f;
  t.ocandradeva = 0x0911;
  t.ocandragujarati = 0x0a91;
  t.ocandravowelsigndeva = 0x0949;
  t.ocandravowelsigngujarati = 0x0ac9;
  t.ocaron = 0x01d2;
  t.ocircle = 0x24de;
  t.ocircumflex = 0x00f4;
  t.ocircumflexacute = 0x1ed1;
  t.ocircumflexdotbelow = 0x1ed9;
  t.ocircumflexgrave = 0x1ed3;
  t.ocircumflexhookabove = 0x1ed5;
  t.ocircumflextilde = 0x1ed7;
  t.ocyrillic = 0x043e;
  t.odblacute = 0x0151;
  t.odblgrave = 0x020d;
  t.odeva = 0x0913;
  t.odieresis = 0x00f6;
  t.odieresiscyrillic = 0x04e7;
  t.odotbelow = 0x1ecd;
  t.oe = 0x0153;
  t.oekorean = 0x315a;
  t.ogonek = 0x02db;
  t.ogonekcmb = 0x0328;
  t.ograve = 0x00f2;
  t.ogujarati = 0x0a93;
  t.oharmenian = 0x0585;
  t.ohiragana = 0x304a;
  t.ohookabove = 0x1ecf;
  t.ohorn = 0x01a1;
  t.ohornacute = 0x1edb;
  t.ohorndotbelow = 0x1ee3;
  t.ohorngrave = 0x1edd;
  t.ohornhookabove = 0x1edf;
  t.ohorntilde = 0x1ee1;
  t.ohungarumlaut = 0x0151;
  t.oi = 0x01a3;
  t.oinvertedbreve = 0x020f;
  t.okatakana = 0x30aa;
  t.okatakanahalfwidth = 0xff75;
  t.okorean = 0x3157;
  t.olehebrew = 0x05ab;
  t.omacron = 0x014d;
  t.omacronacute = 0x1e53;
  t.omacrongrave = 0x1e51;
  t.omdeva = 0x0950;
  t.omega = 0x03c9;
  t.omega1 = 0x03d6;
  t.omegacyrillic = 0x0461;
  t.omegalatinclosed = 0x0277;
  t.omegaroundcyrillic = 0x047b;
  t.omegatitlocyrillic = 0x047d;
  t.omegatonos = 0x03ce;
  t.omgujarati = 0x0ad0;
  t.omicron = 0x03bf;
  t.omicrontonos = 0x03cc;
  t.omonospace = 0xff4f;
  t.one = 0x0031;
  t.onearabic = 0x0661;
  t.onebengali = 0x09e7;
  t.onecircle = 0x2460;
  t.onecircleinversesansserif = 0x278a;
  t.onedeva = 0x0967;
  t.onedotenleader = 0x2024;
  t.oneeighth = 0x215b;
  t.onefitted = 0xf6dc;
  t.onegujarati = 0x0ae7;
  t.onegurmukhi = 0x0a67;
  t.onehackarabic = 0x0661;
  t.onehalf = 0x00bd;
  t.onehangzhou = 0x3021;
  t.oneideographicparen = 0x3220;
  t.oneinferior = 0x2081;
  t.onemonospace = 0xff11;
  t.onenumeratorbengali = 0x09f4;
  t.oneoldstyle = 0xf731;
  t.oneparen = 0x2474;
  t.oneperiod = 0x2488;
  t.onepersian = 0x06f1;
  t.onequarter = 0x00bc;
  t.oneroman = 0x2170;
  t.onesuperior = 0x00b9;
  t.onethai = 0x0e51;
  t.onethird = 0x2153;
  t.oogonek = 0x01eb;
  t.oogonekmacron = 0x01ed;
  t.oogurmukhi = 0x0a13;
  t.oomatragurmukhi = 0x0a4b;
  t.oopen = 0x0254;
  t.oparen = 0x24aa;
  t.openbullet = 0x25e6;
  t.option = 0x2325;
  t.ordfeminine = 0x00aa;
  t.ordmasculine = 0x00ba;
  t.orthogonal = 0x221f;
  t.oshortdeva = 0x0912;
  t.oshortvowelsigndeva = 0x094a;
  t.oslash = 0x00f8;
  t.oslashacute = 0x01ff;
  t.osmallhiragana = 0x3049;
  t.osmallkatakana = 0x30a9;
  t.osmallkatakanahalfwidth = 0xff6b;
  t.ostrokeacute = 0x01ff;
  t.osuperior = 0xf6f0;
  t.otcyrillic = 0x047f;
  t.otilde = 0x00f5;
  t.otildeacute = 0x1e4d;
  t.otildedieresis = 0x1e4f;
  t.oubopomofo = 0x3121;
  t.overline = 0x203e;
  t.overlinecenterline = 0xfe4a;
  t.overlinecmb = 0x0305;
  t.overlinedashed = 0xfe49;
  t.overlinedblwavy = 0xfe4c;
  t.overlinewavy = 0xfe4b;
  t.overscore = 0x00af;
  t.ovowelsignbengali = 0x09cb;
  t.ovowelsigndeva = 0x094b;
  t.ovowelsigngujarati = 0x0acb;
  t.p = 0x0070;
  t.paampssquare = 0x3380;
  t.paasentosquare = 0x332b;
  t.pabengali = 0x09aa;
  t.pacute = 0x1e55;
  t.padeva = 0x092a;
  t.pagedown = 0x21df;
  t.pageup = 0x21de;
  t.pagujarati = 0x0aaa;
  t.pagurmukhi = 0x0a2a;
  t.pahiragana = 0x3071;
  t.paiyannoithai = 0x0e2f;
  t.pakatakana = 0x30d1;
  t.palatalizationcyrilliccmb = 0x0484;
  t.palochkacyrillic = 0x04c0;
  t.pansioskorean = 0x317f;
  t.paragraph = 0x00b6;
  t.parallel = 0x2225;
  t.parenleft = 0x0028;
  t.parenleftaltonearabic = 0xfd3e;
  t.parenleftbt = 0xf8ed;
  t.parenleftex = 0xf8ec;
  t.parenleftinferior = 0x208d;
  t.parenleftmonospace = 0xff08;
  t.parenleftsmall = 0xfe59;
  t.parenleftsuperior = 0x207d;
  t.parenlefttp = 0xf8eb;
  t.parenleftvertical = 0xfe35;
  t.parenright = 0x0029;
  t.parenrightaltonearabic = 0xfd3f;
  t.parenrightbt = 0xf8f8;
  t.parenrightex = 0xf8f7;
  t.parenrightinferior = 0x208e;
  t.parenrightmonospace = 0xff09;
  t.parenrightsmall = 0xfe5a;
  t.parenrightsuperior = 0x207e;
  t.parenrighttp = 0xf8f6;
  t.parenrightvertical = 0xfe36;
  t.partialdiff = 0x2202;
  t.paseqhebrew = 0x05c0;
  t.pashtahebrew = 0x0599;
  t.pasquare = 0x33a9;
  t.patah = 0x05b7;
  t.patah11 = 0x05b7;
  t.patah1d = 0x05b7;
  t.patah2a = 0x05b7;
  t.patahhebrew = 0x05b7;
  t.patahnarrowhebrew = 0x05b7;
  t.patahquarterhebrew = 0x05b7;
  t.patahwidehebrew = 0x05b7;
  t.pazerhebrew = 0x05a1;
  t.pbopomofo = 0x3106;
  t.pcircle = 0x24df;
  t.pdotaccent = 0x1e57;
  t.pe = 0x05e4;
  t.pecyrillic = 0x043f;
  t.pedagesh = 0xfb44;
  t.pedageshhebrew = 0xfb44;
  t.peezisquare = 0x333b;
  t.pefinaldageshhebrew = 0xfb43;
  t.peharabic = 0x067e;
  t.peharmenian = 0x057a;
  t.pehebrew = 0x05e4;
  t.pehfinalarabic = 0xfb57;
  t.pehinitialarabic = 0xfb58;
  t.pehiragana = 0x307a;
  t.pehmedialarabic = 0xfb59;
  t.pekatakana = 0x30da;
  t.pemiddlehookcyrillic = 0x04a7;
  t.perafehebrew = 0xfb4e;
  t.percent = 0x0025;
  t.percentarabic = 0x066a;
  t.percentmonospace = 0xff05;
  t.percentsmall = 0xfe6a;
  t.period = 0x002e;
  t.periodarmenian = 0x0589;
  t.periodcentered = 0x00b7;
  t.periodhalfwidth = 0xff61;
  t.periodinferior = 0xf6e7;
  t.periodmonospace = 0xff0e;
  t.periodsmall = 0xfe52;
  t.periodsuperior = 0xf6e8;
  t.perispomenigreekcmb = 0x0342;
  t.perpendicular = 0x22a5;
  t.perthousand = 0x2030;
  t.peseta = 0x20a7;
  t.pfsquare = 0x338a;
  t.phabengali = 0x09ab;
  t.phadeva = 0x092b;
  t.phagujarati = 0x0aab;
  t.phagurmukhi = 0x0a2b;
  t.phi = 0x03c6;
  t.phi1 = 0x03d5;
  t.phieuphacirclekorean = 0x327a;
  t.phieuphaparenkorean = 0x321a;
  t.phieuphcirclekorean = 0x326c;
  t.phieuphkorean = 0x314d;
  t.phieuphparenkorean = 0x320c;
  t.philatin = 0x0278;
  t.phinthuthai = 0x0e3a;
  t.phisymbolgreek = 0x03d5;
  t.phook = 0x01a5;
  t.phophanthai = 0x0e1e;
  t.phophungthai = 0x0e1c;
  t.phosamphaothai = 0x0e20;
  t.pi = 0x03c0;
  t.pieupacirclekorean = 0x3273;
  t.pieupaparenkorean = 0x3213;
  t.pieupcieuckorean = 0x3176;
  t.pieupcirclekorean = 0x3265;
  t.pieupkiyeokkorean = 0x3172;
  t.pieupkorean = 0x3142;
  t.pieupparenkorean = 0x3205;
  t.pieupsioskiyeokkorean = 0x3174;
  t.pieupsioskorean = 0x3144;
  t.pieupsiostikeutkorean = 0x3175;
  t.pieupthieuthkorean = 0x3177;
  t.pieuptikeutkorean = 0x3173;
  t.pihiragana = 0x3074;
  t.pikatakana = 0x30d4;
  t.pisymbolgreek = 0x03d6;
  t.piwrarmenian = 0x0583;
  t.planckover2pi = 0x210f;
  t.planckover2pi1 = 0x210f;
  t.plus = 0x002b;
  t.plusbelowcmb = 0x031f;
  t.pluscircle = 0x2295;
  t.plusminus = 0x00b1;
  t.plusmod = 0x02d6;
  t.plusmonospace = 0xff0b;
  t.plussmall = 0xfe62;
  t.plussuperior = 0x207a;
  t.pmonospace = 0xff50;
  t.pmsquare = 0x33d8;
  t.pohiragana = 0x307d;
  t.pointingindexdownwhite = 0x261f;
  t.pointingindexleftwhite = 0x261c;
  t.pointingindexrightwhite = 0x261e;
  t.pointingindexupwhite = 0x261d;
  t.pokatakana = 0x30dd;
  t.poplathai = 0x0e1b;
  t.postalmark = 0x3012;
  t.postalmarkface = 0x3020;
  t.pparen = 0x24ab;
  t.precedes = 0x227a;
  t.prescription = 0x211e;
  t.primemod = 0x02b9;
  t.primereversed = 0x2035;
  t.product = 0x220f;
  t.projective = 0x2305;
  t.prolongedkana = 0x30fc;
  t.propellor = 0x2318;
  t.propersubset = 0x2282;
  t.propersuperset = 0x2283;
  t.proportion = 0x2237;
  t.proportional = 0x221d;
  t.psi = 0x03c8;
  t.psicyrillic = 0x0471;
  t.psilipneumatacyrilliccmb = 0x0486;
  t.pssquare = 0x33b0;
  t.puhiragana = 0x3077;
  t.pukatakana = 0x30d7;
  t.pvsquare = 0x33b4;
  t.pwsquare = 0x33ba;
  t.q = 0x0071;
  t.qadeva = 0x0958;
  t.qadmahebrew = 0x05a8;
  t.qafarabic = 0x0642;
  t.qaffinalarabic = 0xfed6;
  t.qafinitialarabic = 0xfed7;
  t.qafmedialarabic = 0xfed8;
  t.qamats = 0x05b8;
  t.qamats10 = 0x05b8;
  t.qamats1a = 0x05b8;
  t.qamats1c = 0x05b8;
  t.qamats27 = 0x05b8;
  t.qamats29 = 0x05b8;
  t.qamats33 = 0x05b8;
  t.qamatsde = 0x05b8;
  t.qamatshebrew = 0x05b8;
  t.qamatsnarrowhebrew = 0x05b8;
  t.qamatsqatanhebrew = 0x05b8;
  t.qamatsqatannarrowhebrew = 0x05b8;
  t.qamatsqatanquarterhebrew = 0x05b8;
  t.qamatsqatanwidehebrew = 0x05b8;
  t.qamatsquarterhebrew = 0x05b8;
  t.qamatswidehebrew = 0x05b8;
  t.qarneyparahebrew = 0x059f;
  t.qbopomofo = 0x3111;
  t.qcircle = 0x24e0;
  t.qhook = 0x02a0;
  t.qmonospace = 0xff51;
  t.qof = 0x05e7;
  t.qofdagesh = 0xfb47;
  t.qofdageshhebrew = 0xfb47;
  t.qofhebrew = 0x05e7;
  t.qparen = 0x24ac;
  t.quarternote = 0x2669;
  t.qubuts = 0x05bb;
  t.qubuts18 = 0x05bb;
  t.qubuts25 = 0x05bb;
  t.qubuts31 = 0x05bb;
  t.qubutshebrew = 0x05bb;
  t.qubutsnarrowhebrew = 0x05bb;
  t.qubutsquarterhebrew = 0x05bb;
  t.qubutswidehebrew = 0x05bb;
  t.question = 0x003f;
  t.questionarabic = 0x061f;
  t.questionarmenian = 0x055e;
  t.questiondown = 0x00bf;
  t.questiondownsmall = 0xf7bf;
  t.questiongreek = 0x037e;
  t.questionmonospace = 0xff1f;
  t.questionsmall = 0xf73f;
  t.quotedbl = 0x0022;
  t.quotedblbase = 0x201e;
  t.quotedblleft = 0x201c;
  t.quotedblmonospace = 0xff02;
  t.quotedblprime = 0x301e;
  t.quotedblprimereversed = 0x301d;
  t.quotedblright = 0x201d;
  t.quoteleft = 0x2018;
  t.quoteleftreversed = 0x201b;
  t.quotereversed = 0x201b;
  t.quoteright = 0x2019;
  t.quoterightn = 0x0149;
  t.quotesinglbase = 0x201a;
  t.quotesingle = 0x0027;
  t.quotesinglemonospace = 0xff07;
  t.r = 0x0072;
  t.raarmenian = 0x057c;
  t.rabengali = 0x09b0;
  t.racute = 0x0155;
  t.radeva = 0x0930;
  t.radical = 0x221a;
  t.radicalex = 0xf8e5;
  t.radoverssquare = 0x33ae;
  t.radoverssquaredsquare = 0x33af;
  t.radsquare = 0x33ad;
  t.rafe = 0x05bf;
  t.rafehebrew = 0x05bf;
  t.ragujarati = 0x0ab0;
  t.ragurmukhi = 0x0a30;
  t.rahiragana = 0x3089;
  t.rakatakana = 0x30e9;
  t.rakatakanahalfwidth = 0xff97;
  t.ralowerdiagonalbengali = 0x09f1;
  t.ramiddlediagonalbengali = 0x09f0;
  t.ramshorn = 0x0264;
  t.ratio = 0x2236;
  t.rbopomofo = 0x3116;
  t.rcaron = 0x0159;
  t.rcedilla = 0x0157;
  t.rcircle = 0x24e1;
  t.rcommaaccent = 0x0157;
  t.rdblgrave = 0x0211;
  t.rdotaccent = 0x1e59;
  t.rdotbelow = 0x1e5b;
  t.rdotbelowmacron = 0x1e5d;
  t.referencemark = 0x203b;
  t.reflexsubset = 0x2286;
  t.reflexsuperset = 0x2287;
  t.registered = 0x00ae;
  t.registersans = 0xf8e8;
  t.registerserif = 0xf6da;
  t.reharabic = 0x0631;
  t.reharmenian = 0x0580;
  t.rehfinalarabic = 0xfeae;
  t.rehiragana = 0x308c;
  t.rekatakana = 0x30ec;
  t.rekatakanahalfwidth = 0xff9a;
  t.resh = 0x05e8;
  t.reshdageshhebrew = 0xfb48;
  t.reshhebrew = 0x05e8;
  t.reversedtilde = 0x223d;
  t.reviahebrew = 0x0597;
  t.reviamugrashhebrew = 0x0597;
  t.revlogicalnot = 0x2310;
  t.rfishhook = 0x027e;
  t.rfishhookreversed = 0x027f;
  t.rhabengali = 0x09dd;
  t.rhadeva = 0x095d;
  t.rho = 0x03c1;
  t.rhook = 0x027d;
  t.rhookturned = 0x027b;
  t.rhookturnedsuperior = 0x02b5;
  t.rhosymbolgreek = 0x03f1;
  t.rhotichookmod = 0x02de;
  t.rieulacirclekorean = 0x3271;
  t.rieulaparenkorean = 0x3211;
  t.rieulcirclekorean = 0x3263;
  t.rieulhieuhkorean = 0x3140;
  t.rieulkiyeokkorean = 0x313a;
  t.rieulkiyeoksioskorean = 0x3169;
  t.rieulkorean = 0x3139;
  t.rieulmieumkorean = 0x313b;
  t.rieulpansioskorean = 0x316c;
  t.rieulparenkorean = 0x3203;
  t.rieulphieuphkorean = 0x313f;
  t.rieulpieupkorean = 0x313c;
  t.rieulpieupsioskorean = 0x316b;
  t.rieulsioskorean = 0x313d;
  t.rieulthieuthkorean = 0x313e;
  t.rieultikeutkorean = 0x316a;
  t.rieulyeorinhieuhkorean = 0x316d;
  t.rightangle = 0x221f;
  t.righttackbelowcmb = 0x0319;
  t.righttriangle = 0x22bf;
  t.rihiragana = 0x308a;
  t.rikatakana = 0x30ea;
  t.rikatakanahalfwidth = 0xff98;
  t.ring = 0x02da;
  t.ringbelowcmb = 0x0325;
  t.ringcmb = 0x030a;
  t.ringhalfleft = 0x02bf;
  t.ringhalfleftarmenian = 0x0559;
  t.ringhalfleftbelowcmb = 0x031c;
  t.ringhalfleftcentered = 0x02d3;
  t.ringhalfright = 0x02be;
  t.ringhalfrightbelowcmb = 0x0339;
  t.ringhalfrightcentered = 0x02d2;
  t.rinvertedbreve = 0x0213;
  t.rittorusquare = 0x3351;
  t.rlinebelow = 0x1e5f;
  t.rlongleg = 0x027c;
  t.rlonglegturned = 0x027a;
  t.rmonospace = 0xff52;
  t.rohiragana = 0x308d;
  t.rokatakana = 0x30ed;
  t.rokatakanahalfwidth = 0xff9b;
  t.roruathai = 0x0e23;
  t.rparen = 0x24ad;
  t.rrabengali = 0x09dc;
  t.rradeva = 0x0931;
  t.rragurmukhi = 0x0a5c;
  t.rreharabic = 0x0691;
  t.rrehfinalarabic = 0xfb8d;
  t.rrvocalicbengali = 0x09e0;
  t.rrvocalicdeva = 0x0960;
  t.rrvocalicgujarati = 0x0ae0;
  t.rrvocalicvowelsignbengali = 0x09c4;
  t.rrvocalicvowelsigndeva = 0x0944;
  t.rrvocalicvowelsigngujarati = 0x0ac4;
  t.rsuperior = 0xf6f1;
  t.rtblock = 0x2590;
  t.rturned = 0x0279;
  t.rturnedsuperior = 0x02b4;
  t.ruhiragana = 0x308b;
  t.rukatakana = 0x30eb;
  t.rukatakanahalfwidth = 0xff99;
  t.rupeemarkbengali = 0x09f2;
  t.rupeesignbengali = 0x09f3;
  t.rupiah = 0xf6dd;
  t.ruthai = 0x0e24;
  t.rvocalicbengali = 0x098b;
  t.rvocalicdeva = 0x090b;
  t.rvocalicgujarati = 0x0a8b;
  t.rvocalicvowelsignbengali = 0x09c3;
  t.rvocalicvowelsigndeva = 0x0943;
  t.rvocalicvowelsigngujarati = 0x0ac3;
  t.s = 0x0073;
  t.sabengali = 0x09b8;
  t.sacute = 0x015b;
  t.sacutedotaccent = 0x1e65;
  t.sadarabic = 0x0635;
  t.sadeva = 0x0938;
  t.sadfinalarabic = 0xfeba;
  t.sadinitialarabic = 0xfebb;
  t.sadmedialarabic = 0xfebc;
  t.sagujarati = 0x0ab8;
  t.sagurmukhi = 0x0a38;
  t.sahiragana = 0x3055;
  t.sakatakana = 0x30b5;
  t.sakatakanahalfwidth = 0xff7b;
  t.sallallahoualayhewasallamarabic = 0xfdfa;
  t.samekh = 0x05e1;
  t.samekhdagesh = 0xfb41;
  t.samekhdageshhebrew = 0xfb41;
  t.samekhhebrew = 0x05e1;
  t.saraaathai = 0x0e32;
  t.saraaethai = 0x0e41;
  t.saraaimaimalaithai = 0x0e44;
  t.saraaimaimuanthai = 0x0e43;
  t.saraamthai = 0x0e33;
  t.saraathai = 0x0e30;
  t.saraethai = 0x0e40;
  t.saraiileftthai = 0xf886;
  t.saraiithai = 0x0e35;
  t.saraileftthai = 0xf885;
  t.saraithai = 0x0e34;
  t.saraothai = 0x0e42;
  t.saraueeleftthai = 0xf888;
  t.saraueethai = 0x0e37;
  t.saraueleftthai = 0xf887;
  t.sarauethai = 0x0e36;
  t.sarauthai = 0x0e38;
  t.sarauuthai = 0x0e39;
  t.sbopomofo = 0x3119;
  t.scaron = 0x0161;
  t.scarondotaccent = 0x1e67;
  t.scedilla = 0x015f;
  t.schwa = 0x0259;
  t.schwacyrillic = 0x04d9;
  t.schwadieresiscyrillic = 0x04db;
  t.schwahook = 0x025a;
  t.scircle = 0x24e2;
  t.scircumflex = 0x015d;
  t.scommaaccent = 0x0219;
  t.sdotaccent = 0x1e61;
  t.sdotbelow = 0x1e63;
  t.sdotbelowdotaccent = 0x1e69;
  t.seagullbelowcmb = 0x033c;
  t.second = 0x2033;
  t.secondtonechinese = 0x02ca;
  t.section = 0x00a7;
  t.seenarabic = 0x0633;
  t.seenfinalarabic = 0xfeb2;
  t.seeninitialarabic = 0xfeb3;
  t.seenmedialarabic = 0xfeb4;
  t.segol = 0x05b6;
  t.segol13 = 0x05b6;
  t.segol1f = 0x05b6;
  t.segol2c = 0x05b6;
  t.segolhebrew = 0x05b6;
  t.segolnarrowhebrew = 0x05b6;
  t.segolquarterhebrew = 0x05b6;
  t.segoltahebrew = 0x0592;
  t.segolwidehebrew = 0x05b6;
  t.seharmenian = 0x057d;
  t.sehiragana = 0x305b;
  t.sekatakana = 0x30bb;
  t.sekatakanahalfwidth = 0xff7e;
  t.semicolon = 0x003b;
  t.semicolonarabic = 0x061b;
  t.semicolonmonospace = 0xff1b;
  t.semicolonsmall = 0xfe54;
  t.semivoicedmarkkana = 0x309c;
  t.semivoicedmarkkanahalfwidth = 0xff9f;
  t.sentisquare = 0x3322;
  t.sentosquare = 0x3323;
  t.seven = 0x0037;
  t.sevenarabic = 0x0667;
  t.sevenbengali = 0x09ed;
  t.sevencircle = 0x2466;
  t.sevencircleinversesansserif = 0x2790;
  t.sevendeva = 0x096d;
  t.seveneighths = 0x215e;
  t.sevengujarati = 0x0aed;
  t.sevengurmukhi = 0x0a6d;
  t.sevenhackarabic = 0x0667;
  t.sevenhangzhou = 0x3027;
  t.sevenideographicparen = 0x3226;
  t.seveninferior = 0x2087;
  t.sevenmonospace = 0xff17;
  t.sevenoldstyle = 0xf737;
  t.sevenparen = 0x247a;
  t.sevenperiod = 0x248e;
  t.sevenpersian = 0x06f7;
  t.sevenroman = 0x2176;
  t.sevensuperior = 0x2077;
  t.seventeencircle = 0x2470;
  t.seventeenparen = 0x2484;
  t.seventeenperiod = 0x2498;
  t.seventhai = 0x0e57;
  t.sfthyphen = 0x00ad;
  t.shaarmenian = 0x0577;
  t.shabengali = 0x09b6;
  t.shacyrillic = 0x0448;
  t.shaddaarabic = 0x0651;
  t.shaddadammaarabic = 0xfc61;
  t.shaddadammatanarabic = 0xfc5e;
  t.shaddafathaarabic = 0xfc60;
  t.shaddakasraarabic = 0xfc62;
  t.shaddakasratanarabic = 0xfc5f;
  t.shade = 0x2592;
  t.shadedark = 0x2593;
  t.shadelight = 0x2591;
  t.shademedium = 0x2592;
  t.shadeva = 0x0936;
  t.shagujarati = 0x0ab6;
  t.shagurmukhi = 0x0a36;
  t.shalshelethebrew = 0x0593;
  t.shbopomofo = 0x3115;
  t.shchacyrillic = 0x0449;
  t.sheenarabic = 0x0634;
  t.sheenfinalarabic = 0xfeb6;
  t.sheeninitialarabic = 0xfeb7;
  t.sheenmedialarabic = 0xfeb8;
  t.sheicoptic = 0x03e3;
  t.sheqel = 0x20aa;
  t.sheqelhebrew = 0x20aa;
  t.sheva = 0x05b0;
  t.sheva115 = 0x05b0;
  t.sheva15 = 0x05b0;
  t.sheva22 = 0x05b0;
  t.sheva2e = 0x05b0;
  t.shevahebrew = 0x05b0;
  t.shevanarrowhebrew = 0x05b0;
  t.shevaquarterhebrew = 0x05b0;
  t.shevawidehebrew = 0x05b0;
  t.shhacyrillic = 0x04bb;
  t.shimacoptic = 0x03ed;
  t.shin = 0x05e9;
  t.shindagesh = 0xfb49;
  t.shindageshhebrew = 0xfb49;
  t.shindageshshindot = 0xfb2c;
  t.shindageshshindothebrew = 0xfb2c;
  t.shindageshsindot = 0xfb2d;
  t.shindageshsindothebrew = 0xfb2d;
  t.shindothebrew = 0x05c1;
  t.shinhebrew = 0x05e9;
  t.shinshindot = 0xfb2a;
  t.shinshindothebrew = 0xfb2a;
  t.shinsindot = 0xfb2b;
  t.shinsindothebrew = 0xfb2b;
  t.shook = 0x0282;
  t.sigma = 0x03c3;
  t.sigma1 = 0x03c2;
  t.sigmafinal = 0x03c2;
  t.sigmalunatesymbolgreek = 0x03f2;
  t.sihiragana = 0x3057;
  t.sikatakana = 0x30b7;
  t.sikatakanahalfwidth = 0xff7c;
  t.siluqhebrew = 0x05bd;
  t.siluqlefthebrew = 0x05bd;
  t.similar = 0x223c;
  t.sindothebrew = 0x05c2;
  t.siosacirclekorean = 0x3274;
  t.siosaparenkorean = 0x3214;
  t.sioscieuckorean = 0x317e;
  t.sioscirclekorean = 0x3266;
  t.sioskiyeokkorean = 0x317a;
  t.sioskorean = 0x3145;
  t.siosnieunkorean = 0x317b;
  t.siosparenkorean = 0x3206;
  t.siospieupkorean = 0x317d;
  t.siostikeutkorean = 0x317c;
  t.six = 0x0036;
  t.sixarabic = 0x0666;
  t.sixbengali = 0x09ec;
  t.sixcircle = 0x2465;
  t.sixcircleinversesansserif = 0x278f;
  t.sixdeva = 0x096c;
  t.sixgujarati = 0x0aec;
  t.sixgurmukhi = 0x0a6c;
  t.sixhackarabic = 0x0666;
  t.sixhangzhou = 0x3026;
  t.sixideographicparen = 0x3225;
  t.sixinferior = 0x2086;
  t.sixmonospace = 0xff16;
  t.sixoldstyle = 0xf736;
  t.sixparen = 0x2479;
  t.sixperiod = 0x248d;
  t.sixpersian = 0x06f6;
  t.sixroman = 0x2175;
  t.sixsuperior = 0x2076;
  t.sixteencircle = 0x246f;
  t.sixteencurrencydenominatorbengali = 0x09f9;
  t.sixteenparen = 0x2483;
  t.sixteenperiod = 0x2497;
  t.sixthai = 0x0e56;
  t.slash = 0x002f;
  t.slashmonospace = 0xff0f;
  t.slong = 0x017f;
  t.slongdotaccent = 0x1e9b;
  t.smileface = 0x263a;
  t.smonospace = 0xff53;
  t.sofpasuqhebrew = 0x05c3;
  t.softhyphen = 0x00ad;
  t.softsigncyrillic = 0x044c;
  t.sohiragana = 0x305d;
  t.sokatakana = 0x30bd;
  t.sokatakanahalfwidth = 0xff7f;
  t.soliduslongoverlaycmb = 0x0338;
  t.solidusshortoverlaycmb = 0x0337;
  t.sorusithai = 0x0e29;
  t.sosalathai = 0x0e28;
  t.sosothai = 0x0e0b;
  t.sosuathai = 0x0e2a;
  t.space = 0x0020;
  t.spacehackarabic = 0x0020;
  t.spade = 0x2660;
  t.spadesuitblack = 0x2660;
  t.spadesuitwhite = 0x2664;
  t.sparen = 0x24ae;
  t.squarebelowcmb = 0x033b;
  t.squarecc = 0x33c4;
  t.squarecm = 0x339d;
  t.squarediagonalcrosshatchfill = 0x25a9;
  t.squarehorizontalfill = 0x25a4;
  t.squarekg = 0x338f;
  t.squarekm = 0x339e;
  t.squarekmcapital = 0x33ce;
  t.squareln = 0x33d1;
  t.squarelog = 0x33d2;
  t.squaremg = 0x338e;
  t.squaremil = 0x33d5;
  t.squaremm = 0x339c;
  t.squaremsquared = 0x33a1;
  t.squareorthogonalcrosshatchfill = 0x25a6;
  t.squareupperlefttolowerrightfill = 0x25a7;
  t.squareupperrighttolowerleftfill = 0x25a8;
  t.squareverticalfill = 0x25a5;
  t.squarewhitewithsmallblack = 0x25a3;
  t.srsquare = 0x33db;
  t.ssabengali = 0x09b7;
  t.ssadeva = 0x0937;
  t.ssagujarati = 0x0ab7;
  t.ssangcieuckorean = 0x3149;
  t.ssanghieuhkorean = 0x3185;
  t.ssangieungkorean = 0x3180;
  t.ssangkiyeokkorean = 0x3132;
  t.ssangnieunkorean = 0x3165;
  t.ssangpieupkorean = 0x3143;
  t.ssangsioskorean = 0x3146;
  t.ssangtikeutkorean = 0x3138;
  t.ssuperior = 0xf6f2;
  t.sterling = 0x00a3;
  t.sterlingmonospace = 0xffe1;
  t.strokelongoverlaycmb = 0x0336;
  t.strokeshortoverlaycmb = 0x0335;
  t.subset = 0x2282;
  t.subsetnotequal = 0x228a;
  t.subsetorequal = 0x2286;
  t.succeeds = 0x227b;
  t.suchthat = 0x220b;
  t.suhiragana = 0x3059;
  t.sukatakana = 0x30b9;
  t.sukatakanahalfwidth = 0xff7d;
  t.sukunarabic = 0x0652;
  t.summation = 0x2211;
  t.sun = 0x263c;
  t.superset = 0x2283;
  t.supersetnotequal = 0x228b;
  t.supersetorequal = 0x2287;
  t.svsquare = 0x33dc;
  t.syouwaerasquare = 0x337c;
  t.t = 0x0074;
  t.tabengali = 0x09a4;
  t.tackdown = 0x22a4;
  t.tackleft = 0x22a3;
  t.tadeva = 0x0924;
  t.tagujarati = 0x0aa4;
  t.tagurmukhi = 0x0a24;
  t.taharabic = 0x0637;
  t.tahfinalarabic = 0xfec2;
  t.tahinitialarabic = 0xfec3;
  t.tahiragana = 0x305f;
  t.tahmedialarabic = 0xfec4;
  t.taisyouerasquare = 0x337d;
  t.takatakana = 0x30bf;
  t.takatakanahalfwidth = 0xff80;
  t.tatweelarabic = 0x0640;
  t.tau = 0x03c4;
  t.tav = 0x05ea;
  t.tavdages = 0xfb4a;
  t.tavdagesh = 0xfb4a;
  t.tavdageshhebrew = 0xfb4a;
  t.tavhebrew = 0x05ea;
  t.tbar = 0x0167;
  t.tbopomofo = 0x310a;
  t.tcaron = 0x0165;
  t.tccurl = 0x02a8;
  t.tcedilla = 0x0163;
  t.tcheharabic = 0x0686;
  t.tchehfinalarabic = 0xfb7b;
  t.tchehinitialarabic = 0xfb7c;
  t.tchehmedialarabic = 0xfb7d;
  t.tcircle = 0x24e3;
  t.tcircumflexbelow = 0x1e71;
  t.tcommaaccent = 0x0163;
  t.tdieresis = 0x1e97;
  t.tdotaccent = 0x1e6b;
  t.tdotbelow = 0x1e6d;
  t.tecyrillic = 0x0442;
  t.tedescendercyrillic = 0x04ad;
  t.teharabic = 0x062a;
  t.tehfinalarabic = 0xfe96;
  t.tehhahinitialarabic = 0xfca2;
  t.tehhahisolatedarabic = 0xfc0c;
  t.tehinitialarabic = 0xfe97;
  t.tehiragana = 0x3066;
  t.tehjeeminitialarabic = 0xfca1;
  t.tehjeemisolatedarabic = 0xfc0b;
  t.tehmarbutaarabic = 0x0629;
  t.tehmarbutafinalarabic = 0xfe94;
  t.tehmedialarabic = 0xfe98;
  t.tehmeeminitialarabic = 0xfca4;
  t.tehmeemisolatedarabic = 0xfc0e;
  t.tehnoonfinalarabic = 0xfc73;
  t.tekatakana = 0x30c6;
  t.tekatakanahalfwidth = 0xff83;
  t.telephone = 0x2121;
  t.telephoneblack = 0x260e;
  t.telishagedolahebrew = 0x05a0;
  t.telishaqetanahebrew = 0x05a9;
  t.tencircle = 0x2469;
  t.tenideographicparen = 0x3229;
  t.tenparen = 0x247d;
  t.tenperiod = 0x2491;
  t.tenroman = 0x2179;
  t.tesh = 0x02a7;
  t.tet = 0x05d8;
  t.tetdagesh = 0xfb38;
  t.tetdageshhebrew = 0xfb38;
  t.tethebrew = 0x05d8;
  t.tetsecyrillic = 0x04b5;
  t.tevirhebrew = 0x059b;
  t.tevirlefthebrew = 0x059b;
  t.thabengali = 0x09a5;
  t.thadeva = 0x0925;
  t.thagujarati = 0x0aa5;
  t.thagurmukhi = 0x0a25;
  t.thalarabic = 0x0630;
  t.thalfinalarabic = 0xfeac;
  t.thanthakhatlowleftthai = 0xf898;
  t.thanthakhatlowrightthai = 0xf897;
  t.thanthakhatthai = 0x0e4c;
  t.thanthakhatupperleftthai = 0xf896;
  t.theharabic = 0x062b;
  t.thehfinalarabic = 0xfe9a;
  t.thehinitialarabic = 0xfe9b;
  t.thehmedialarabic = 0xfe9c;
  t.thereexists = 0x2203;
  t.therefore = 0x2234;
  t.theta = 0x03b8;
  t.theta1 = 0x03d1;
  t.thetasymbolgreek = 0x03d1;
  t.thieuthacirclekorean = 0x3279;
  t.thieuthaparenkorean = 0x3219;
  t.thieuthcirclekorean = 0x326b;
  t.thieuthkorean = 0x314c;
  t.thieuthparenkorean = 0x320b;
  t.thirteencircle = 0x246c;
  t.thirteenparen = 0x2480;
  t.thirteenperiod = 0x2494;
  t.thonangmonthothai = 0x0e11;
  t.thook = 0x01ad;
  t.thophuthaothai = 0x0e12;
  t.thorn = 0x00fe;
  t.thothahanthai = 0x0e17;
  t.thothanthai = 0x0e10;
  t.thothongthai = 0x0e18;
  t.thothungthai = 0x0e16;
  t.thousandcyrillic = 0x0482;
  t.thousandsseparatorarabic = 0x066c;
  t.thousandsseparatorpersian = 0x066c;
  t.three = 0x0033;
  t.threearabic = 0x0663;
  t.threebengali = 0x09e9;
  t.threecircle = 0x2462;
  t.threecircleinversesansserif = 0x278c;
  t.threedeva = 0x0969;
  t.threeeighths = 0x215c;
  t.threegujarati = 0x0ae9;
  t.threegurmukhi = 0x0a69;
  t.threehackarabic = 0x0663;
  t.threehangzhou = 0x3023;
  t.threeideographicparen = 0x3222;
  t.threeinferior = 0x2083;
  t.threemonospace = 0xff13;
  t.threenumeratorbengali = 0x09f6;
  t.threeoldstyle = 0xf733;
  t.threeparen = 0x2476;
  t.threeperiod = 0x248a;
  t.threepersian = 0x06f3;
  t.threequarters = 0x00be;
  t.threequartersemdash = 0xf6de;
  t.threeroman = 0x2172;
  t.threesuperior = 0x00b3;
  t.threethai = 0x0e53;
  t.thzsquare = 0x3394;
  t.tihiragana = 0x3061;
  t.tikatakana = 0x30c1;
  t.tikatakanahalfwidth = 0xff81;
  t.tikeutacirclekorean = 0x3270;
  t.tikeutaparenkorean = 0x3210;
  t.tikeutcirclekorean = 0x3262;
  t.tikeutkorean = 0x3137;
  t.tikeutparenkorean = 0x3202;
  t.tilde = 0x02dc;
  t.tildebelowcmb = 0x0330;
  t.tildecmb = 0x0303;
  t.tildecomb = 0x0303;
  t.tildedoublecmb = 0x0360;
  t.tildeoperator = 0x223c;
  t.tildeoverlaycmb = 0x0334;
  t.tildeverticalcmb = 0x033e;
  t.timescircle = 0x2297;
  t.tipehahebrew = 0x0596;
  t.tipehalefthebrew = 0x0596;
  t.tippigurmukhi = 0x0a70;
  t.titlocyrilliccmb = 0x0483;
  t.tiwnarmenian = 0x057f;
  t.tlinebelow = 0x1e6f;
  t.tmonospace = 0xff54;
  t.toarmenian = 0x0569;
  t.tohiragana = 0x3068;
  t.tokatakana = 0x30c8;
  t.tokatakanahalfwidth = 0xff84;
  t.tonebarextrahighmod = 0x02e5;
  t.tonebarextralowmod = 0x02e9;
  t.tonebarhighmod = 0x02e6;
  t.tonebarlowmod = 0x02e8;
  t.tonebarmidmod = 0x02e7;
  t.tonefive = 0x01bd;
  t.tonesix = 0x0185;
  t.tonetwo = 0x01a8;
  t.tonos = 0x0384;
  t.tonsquare = 0x3327;
  t.topatakthai = 0x0e0f;
  t.tortoiseshellbracketleft = 0x3014;
  t.tortoiseshellbracketleftsmall = 0xfe5d;
  t.tortoiseshellbracketleftvertical = 0xfe39;
  t.tortoiseshellbracketright = 0x3015;
  t.tortoiseshellbracketrightsmall = 0xfe5e;
  t.tortoiseshellbracketrightvertical = 0xfe3a;
  t.totaothai = 0x0e15;
  t.tpalatalhook = 0x01ab;
  t.tparen = 0x24af;
  t.trademark = 0x2122;
  t.trademarksans = 0xf8ea;
  t.trademarkserif = 0xf6db;
  t.tretroflexhook = 0x0288;
  t.triagdn = 0x25bc;
  t.triaglf = 0x25c4;
  t.triagrt = 0x25ba;
  t.triagup = 0x25b2;
  t.ts = 0x02a6;
  t.tsadi = 0x05e6;
  t.tsadidagesh = 0xfb46;
  t.tsadidageshhebrew = 0xfb46;
  t.tsadihebrew = 0x05e6;
  t.tsecyrillic = 0x0446;
  t.tsere = 0x05b5;
  t.tsere12 = 0x05b5;
  t.tsere1e = 0x05b5;
  t.tsere2b = 0x05b5;
  t.tserehebrew = 0x05b5;
  t.tserenarrowhebrew = 0x05b5;
  t.tserequarterhebrew = 0x05b5;
  t.tserewidehebrew = 0x05b5;
  t.tshecyrillic = 0x045b;
  t.tsuperior = 0xf6f3;
  t.ttabengali = 0x099f;
  t.ttadeva = 0x091f;
  t.ttagujarati = 0x0a9f;
  t.ttagurmukhi = 0x0a1f;
  t.tteharabic = 0x0679;
  t.ttehfinalarabic = 0xfb67;
  t.ttehinitialarabic = 0xfb68;
  t.ttehmedialarabic = 0xfb69;
  t.tthabengali = 0x09a0;
  t.tthadeva = 0x0920;
  t.tthagujarati = 0x0aa0;
  t.tthagurmukhi = 0x0a20;
  t.tturned = 0x0287;
  t.tuhiragana = 0x3064;
  t.tukatakana = 0x30c4;
  t.tukatakanahalfwidth = 0xff82;
  t.tusmallhiragana = 0x3063;
  t.tusmallkatakana = 0x30c3;
  t.tusmallkatakanahalfwidth = 0xff6f;
  t.twelvecircle = 0x246b;
  t.twelveparen = 0x247f;
  t.twelveperiod = 0x2493;
  t.twelveroman = 0x217b;
  t.twentycircle = 0x2473;
  t.twentyhangzhou = 0x5344;
  t.twentyparen = 0x2487;
  t.twentyperiod = 0x249b;
  t.two = 0x0032;
  t.twoarabic = 0x0662;
  t.twobengali = 0x09e8;
  t.twocircle = 0x2461;
  t.twocircleinversesansserif = 0x278b;
  t.twodeva = 0x0968;
  t.twodotenleader = 0x2025;
  t.twodotleader = 0x2025;
  t.twodotleadervertical = 0xfe30;
  t.twogujarati = 0x0ae8;
  t.twogurmukhi = 0x0a68;
  t.twohackarabic = 0x0662;
  t.twohangzhou = 0x3022;
  t.twoideographicparen = 0x3221;
  t.twoinferior = 0x2082;
  t.twomonospace = 0xff12;
  t.twonumeratorbengali = 0x09f5;
  t.twooldstyle = 0xf732;
  t.twoparen = 0x2475;
  t.twoperiod = 0x2489;
  t.twopersian = 0x06f2;
  t.tworoman = 0x2171;
  t.twostroke = 0x01bb;
  t.twosuperior = 0x00b2;
  t.twothai = 0x0e52;
  t.twothirds = 0x2154;
  t.u = 0x0075;
  t.uacute = 0x00fa;
  t.ubar = 0x0289;
  t.ubengali = 0x0989;
  t.ubopomofo = 0x3128;
  t.ubreve = 0x016d;
  t.ucaron = 0x01d4;
  t.ucircle = 0x24e4;
  t.ucircumflex = 0x00fb;
  t.ucircumflexbelow = 0x1e77;
  t.ucyrillic = 0x0443;
  t.udattadeva = 0x0951;
  t.udblacute = 0x0171;
  t.udblgrave = 0x0215;
  t.udeva = 0x0909;
  t.udieresis = 0x00fc;
  t.udieresisacute = 0x01d8;
  t.udieresisbelow = 0x1e73;
  t.udieresiscaron = 0x01da;
  t.udieresiscyrillic = 0x04f1;
  t.udieresisgrave = 0x01dc;
  t.udieresismacron = 0x01d6;
  t.udotbelow = 0x1ee5;
  t.ugrave = 0x00f9;
  t.ugujarati = 0x0a89;
  t.ugurmukhi = 0x0a09;
  t.uhiragana = 0x3046;
  t.uhookabove = 0x1ee7;
  t.uhorn = 0x01b0;
  t.uhornacute = 0x1ee9;
  t.uhorndotbelow = 0x1ef1;
  t.uhorngrave = 0x1eeb;
  t.uhornhookabove = 0x1eed;
  t.uhorntilde = 0x1eef;
  t.uhungarumlaut = 0x0171;
  t.uhungarumlautcyrillic = 0x04f3;
  t.uinvertedbreve = 0x0217;
  t.ukatakana = 0x30a6;
  t.ukatakanahalfwidth = 0xff73;
  t.ukcyrillic = 0x0479;
  t.ukorean = 0x315c;
  t.umacron = 0x016b;
  t.umacroncyrillic = 0x04ef;
  t.umacrondieresis = 0x1e7b;
  t.umatragurmukhi = 0x0a41;
  t.umonospace = 0xff55;
  t.underscore = 0x005f;
  t.underscoredbl = 0x2017;
  t.underscoremonospace = 0xff3f;
  t.underscorevertical = 0xfe33;
  t.underscorewavy = 0xfe4f;
  t.union = 0x222a;
  t.universal = 0x2200;
  t.uogonek = 0x0173;
  t.uparen = 0x24b0;
  t.upblock = 0x2580;
  t.upperdothebrew = 0x05c4;
  t.upsilon = 0x03c5;
  t.upsilondieresis = 0x03cb;
  t.upsilondieresistonos = 0x03b0;
  t.upsilonlatin = 0x028a;
  t.upsilontonos = 0x03cd;
  t.uptackbelowcmb = 0x031d;
  t.uptackmod = 0x02d4;
  t.uragurmukhi = 0x0a73;
  t.uring = 0x016f;
  t.ushortcyrillic = 0x045e;
  t.usmallhiragana = 0x3045;
  t.usmallkatakana = 0x30a5;
  t.usmallkatakanahalfwidth = 0xff69;
  t.ustraightcyrillic = 0x04af;
  t.ustraightstrokecyrillic = 0x04b1;
  t.utilde = 0x0169;
  t.utildeacute = 0x1e79;
  t.utildebelow = 0x1e75;
  t.uubengali = 0x098a;
  t.uudeva = 0x090a;
  t.uugujarati = 0x0a8a;
  t.uugurmukhi = 0x0a0a;
  t.uumatragurmukhi = 0x0a42;
  t.uuvowelsignbengali = 0x09c2;
  t.uuvowelsigndeva = 0x0942;
  t.uuvowelsigngujarati = 0x0ac2;
  t.uvowelsignbengali = 0x09c1;
  t.uvowelsigndeva = 0x0941;
  t.uvowelsigngujarati = 0x0ac1;
  t.v = 0x0076;
  t.vadeva = 0x0935;
  t.vagujarati = 0x0ab5;
  t.vagurmukhi = 0x0a35;
  t.vakatakana = 0x30f7;
  t.vav = 0x05d5;
  t.vavdagesh = 0xfb35;
  t.vavdagesh65 = 0xfb35;
  t.vavdageshhebrew = 0xfb35;
  t.vavhebrew = 0x05d5;
  t.vavholam = 0xfb4b;
  t.vavholamhebrew = 0xfb4b;
  t.vavvavhebrew = 0x05f0;
  t.vavyodhebrew = 0x05f1;
  t.vcircle = 0x24e5;
  t.vdotbelow = 0x1e7f;
  t.vecyrillic = 0x0432;
  t.veharabic = 0x06a4;
  t.vehfinalarabic = 0xfb6b;
  t.vehinitialarabic = 0xfb6c;
  t.vehmedialarabic = 0xfb6d;
  t.vekatakana = 0x30f9;
  t.venus = 0x2640;
  t.verticalbar = 0x007c;
  t.verticallineabovecmb = 0x030d;
  t.verticallinebelowcmb = 0x0329;
  t.verticallinelowmod = 0x02cc;
  t.verticallinemod = 0x02c8;
  t.vewarmenian = 0x057e;
  t.vhook = 0x028b;
  t.vikatakana = 0x30f8;
  t.viramabengali = 0x09cd;
  t.viramadeva = 0x094d;
  t.viramagujarati = 0x0acd;
  t.visargabengali = 0x0983;
  t.visargadeva = 0x0903;
  t.visargagujarati = 0x0a83;
  t.vmonospace = 0xff56;
  t.voarmenian = 0x0578;
  t.voicediterationhiragana = 0x309e;
  t.voicediterationkatakana = 0x30fe;
  t.voicedmarkkana = 0x309b;
  t.voicedmarkkanahalfwidth = 0xff9e;
  t.vokatakana = 0x30fa;
  t.vparen = 0x24b1;
  t.vtilde = 0x1e7d;
  t.vturned = 0x028c;
  t.vuhiragana = 0x3094;
  t.vukatakana = 0x30f4;
  t.w = 0x0077;
  t.wacute = 0x1e83;
  t.waekorean = 0x3159;
  t.wahiragana = 0x308f;
  t.wakatakana = 0x30ef;
  t.wakatakanahalfwidth = 0xff9c;
  t.wakorean = 0x3158;
  t.wasmallhiragana = 0x308e;
  t.wasmallkatakana = 0x30ee;
  t.wattosquare = 0x3357;
  t.wavedash = 0x301c;
  t.wavyunderscorevertical = 0xfe34;
  t.wawarabic = 0x0648;
  t.wawfinalarabic = 0xfeee;
  t.wawhamzaabovearabic = 0x0624;
  t.wawhamzaabovefinalarabic = 0xfe86;
  t.wbsquare = 0x33dd;
  t.wcircle = 0x24e6;
  t.wcircumflex = 0x0175;
  t.wdieresis = 0x1e85;
  t.wdotaccent = 0x1e87;
  t.wdotbelow = 0x1e89;
  t.wehiragana = 0x3091;
  t.weierstrass = 0x2118;
  t.wekatakana = 0x30f1;
  t.wekorean = 0x315e;
  t.weokorean = 0x315d;
  t.wgrave = 0x1e81;
  t.whitebullet = 0x25e6;
  t.whitecircle = 0x25cb;
  t.whitecircleinverse = 0x25d9;
  t.whitecornerbracketleft = 0x300e;
  t.whitecornerbracketleftvertical = 0xfe43;
  t.whitecornerbracketright = 0x300f;
  t.whitecornerbracketrightvertical = 0xfe44;
  t.whitediamond = 0x25c7;
  t.whitediamondcontainingblacksmalldiamond = 0x25c8;
  t.whitedownpointingsmalltriangle = 0x25bf;
  t.whitedownpointingtriangle = 0x25bd;
  t.whiteleftpointingsmalltriangle = 0x25c3;
  t.whiteleftpointingtriangle = 0x25c1;
  t.whitelenticularbracketleft = 0x3016;
  t.whitelenticularbracketright = 0x3017;
  t.whiterightpointingsmalltriangle = 0x25b9;
  t.whiterightpointingtriangle = 0x25b7;
  t.whitesmallsquare = 0x25ab;
  t.whitesmilingface = 0x263a;
  t.whitesquare = 0x25a1;
  t.whitestar = 0x2606;
  t.whitetelephone = 0x260f;
  t.whitetortoiseshellbracketleft = 0x3018;
  t.whitetortoiseshellbracketright = 0x3019;
  t.whiteuppointingsmalltriangle = 0x25b5;
  t.whiteuppointingtriangle = 0x25b3;
  t.wihiragana = 0x3090;
  t.wikatakana = 0x30f0;
  t.wikorean = 0x315f;
  t.wmonospace = 0xff57;
  t.wohiragana = 0x3092;
  t.wokatakana = 0x30f2;
  t.wokatakanahalfwidth = 0xff66;
  t.won = 0x20a9;
  t.wonmonospace = 0xffe6;
  t.wowaenthai = 0x0e27;
  t.wparen = 0x24b2;
  t.wring = 0x1e98;
  t.wsuperior = 0x02b7;
  t.wturned = 0x028d;
  t.wynn = 0x01bf;
  t.x = 0x0078;
  t.xabovecmb = 0x033d;
  t.xbopomofo = 0x3112;
  t.xcircle = 0x24e7;
  t.xdieresis = 0x1e8d;
  t.xdotaccent = 0x1e8b;
  t.xeharmenian = 0x056d;
  t.xi = 0x03be;
  t.xmonospace = 0xff58;
  t.xparen = 0x24b3;
  t.xsuperior = 0x02e3;
  t.y = 0x0079;
  t.yaadosquare = 0x334e;
  t.yabengali = 0x09af;
  t.yacute = 0x00fd;
  t.yadeva = 0x092f;
  t.yaekorean = 0x3152;
  t.yagujarati = 0x0aaf;
  t.yagurmukhi = 0x0a2f;
  t.yahiragana = 0x3084;
  t.yakatakana = 0x30e4;
  t.yakatakanahalfwidth = 0xff94;
  t.yakorean = 0x3151;
  t.yamakkanthai = 0x0e4e;
  t.yasmallhiragana = 0x3083;
  t.yasmallkatakana = 0x30e3;
  t.yasmallkatakanahalfwidth = 0xff6c;
  t.yatcyrillic = 0x0463;
  t.ycircle = 0x24e8;
  t.ycircumflex = 0x0177;
  t.ydieresis = 0x00ff;
  t.ydotaccent = 0x1e8f;
  t.ydotbelow = 0x1ef5;
  t.yeharabic = 0x064a;
  t.yehbarreearabic = 0x06d2;
  t.yehbarreefinalarabic = 0xfbaf;
  t.yehfinalarabic = 0xfef2;
  t.yehhamzaabovearabic = 0x0626;
  t.yehhamzaabovefinalarabic = 0xfe8a;
  t.yehhamzaaboveinitialarabic = 0xfe8b;
  t.yehhamzaabovemedialarabic = 0xfe8c;
  t.yehinitialarabic = 0xfef3;
  t.yehmedialarabic = 0xfef4;
  t.yehmeeminitialarabic = 0xfcdd;
  t.yehmeemisolatedarabic = 0xfc58;
  t.yehnoonfinalarabic = 0xfc94;
  t.yehthreedotsbelowarabic = 0x06d1;
  t.yekorean = 0x3156;
  t.yen = 0x00a5;
  t.yenmonospace = 0xffe5;
  t.yeokorean = 0x3155;
  t.yeorinhieuhkorean = 0x3186;
  t.yerahbenyomohebrew = 0x05aa;
  t.yerahbenyomolefthebrew = 0x05aa;
  t.yericyrillic = 0x044b;
  t.yerudieresiscyrillic = 0x04f9;
  t.yesieungkorean = 0x3181;
  t.yesieungpansioskorean = 0x3183;
  t.yesieungsioskorean = 0x3182;
  t.yetivhebrew = 0x059a;
  t.ygrave = 0x1ef3;
  t.yhook = 0x01b4;
  t.yhookabove = 0x1ef7;
  t.yiarmenian = 0x0575;
  t.yicyrillic = 0x0457;
  t.yikorean = 0x3162;
  t.yinyang = 0x262f;
  t.yiwnarmenian = 0x0582;
  t.ymonospace = 0xff59;
  t.yod = 0x05d9;
  t.yoddagesh = 0xfb39;
  t.yoddageshhebrew = 0xfb39;
  t.yodhebrew = 0x05d9;
  t.yodyodhebrew = 0x05f2;
  t.yodyodpatahhebrew = 0xfb1f;
  t.yohiragana = 0x3088;
  t.yoikorean = 0x3189;
  t.yokatakana = 0x30e8;
  t.yokatakanahalfwidth = 0xff96;
  t.yokorean = 0x315b;
  t.yosmallhiragana = 0x3087;
  t.yosmallkatakana = 0x30e7;
  t.yosmallkatakanahalfwidth = 0xff6e;
  t.yotgreek = 0x03f3;
  t.yoyaekorean = 0x3188;
  t.yoyakorean = 0x3187;
  t.yoyakthai = 0x0e22;
  t.yoyingthai = 0x0e0d;
  t.yparen = 0x24b4;
  t.ypogegrammeni = 0x037a;
  t.ypogegrammenigreekcmb = 0x0345;
  t.yr = 0x01a6;
  t.yring = 0x1e99;
  t.ysuperior = 0x02b8;
  t.ytilde = 0x1ef9;
  t.yturned = 0x028e;
  t.yuhiragana = 0x3086;
  t.yuikorean = 0x318c;
  t.yukatakana = 0x30e6;
  t.yukatakanahalfwidth = 0xff95;
  t.yukorean = 0x3160;
  t.yusbigcyrillic = 0x046b;
  t.yusbigiotifiedcyrillic = 0x046d;
  t.yuslittlecyrillic = 0x0467;
  t.yuslittleiotifiedcyrillic = 0x0469;
  t.yusmallhiragana = 0x3085;
  t.yusmallkatakana = 0x30e5;
  t.yusmallkatakanahalfwidth = 0xff6d;
  t.yuyekorean = 0x318b;
  t.yuyeokorean = 0x318a;
  t.yyabengali = 0x09df;
  t.yyadeva = 0x095f;
  t.z = 0x007a;
  t.zaarmenian = 0x0566;
  t.zacute = 0x017a;
  t.zadeva = 0x095b;
  t.zagurmukhi = 0x0a5b;
  t.zaharabic = 0x0638;
  t.zahfinalarabic = 0xfec6;
  t.zahinitialarabic = 0xfec7;
  t.zahiragana = 0x3056;
  t.zahmedialarabic = 0xfec8;
  t.zainarabic = 0x0632;
  t.zainfinalarabic = 0xfeb0;
  t.zakatakana = 0x30b6;
  t.zaqefgadolhebrew = 0x0595;
  t.zaqefqatanhebrew = 0x0594;
  t.zarqahebrew = 0x0598;
  t.zayin = 0x05d6;
  t.zayindagesh = 0xfb36;
  t.zayindageshhebrew = 0xfb36;
  t.zayinhebrew = 0x05d6;
  t.zbopomofo = 0x3117;
  t.zcaron = 0x017e;
  t.zcircle = 0x24e9;
  t.zcircumflex = 0x1e91;
  t.zcurl = 0x0291;
  t.zdot = 0x017c;
  t.zdotaccent = 0x017c;
  t.zdotbelow = 0x1e93;
  t.zecyrillic = 0x0437;
  t.zedescendercyrillic = 0x0499;
  t.zedieresiscyrillic = 0x04df;
  t.zehiragana = 0x305c;
  t.zekatakana = 0x30bc;
  t.zero = 0x0030;
  t.zeroarabic = 0x0660;
  t.zerobengali = 0x09e6;
  t.zerodeva = 0x0966;
  t.zerogujarati = 0x0ae6;
  t.zerogurmukhi = 0x0a66;
  t.zerohackarabic = 0x0660;
  t.zeroinferior = 0x2080;
  t.zeromonospace = 0xff10;
  t.zerooldstyle = 0xf730;
  t.zeropersian = 0x06f0;
  t.zerosuperior = 0x2070;
  t.zerothai = 0x0e50;
  t.zerowidthjoiner = 0xfeff;
  t.zerowidthnonjoiner = 0x200c;
  t.zerowidthspace = 0x200b;
  t.zeta = 0x03b6;
  t.zhbopomofo = 0x3113;
  t.zhearmenian = 0x056a;
  t.zhebrevecyrillic = 0x04c2;
  t.zhecyrillic = 0x0436;
  t.zhedescendercyrillic = 0x0497;
  t.zhedieresiscyrillic = 0x04dd;
  t.zihiragana = 0x3058;
  t.zikatakana = 0x30b8;
  t.zinorhebrew = 0x05ae;
  t.zlinebelow = 0x1e95;
  t.zmonospace = 0xff5a;
  t.zohiragana = 0x305e;
  t.zokatakana = 0x30be;
  t.zparen = 0x24b5;
  t.zretroflexhook = 0x0290;
  t.zstroke = 0x01b6;
  t.zuhiragana = 0x305a;
  t.zukatakana = 0x30ba;
  t[".notdef"] = 0x0000;
  t.angbracketleftbig = 0x2329;
  t.angbracketleftBig = 0x2329;
  t.angbracketleftbigg = 0x2329;
  t.angbracketleftBigg = 0x2329;
  t.angbracketrightBig = 0x232a;
  t.angbracketrightbig = 0x232a;
  t.angbracketrightBigg = 0x232a;
  t.angbracketrightbigg = 0x232a;
  t.arrowhookleft = 0x21aa;
  t.arrowhookright = 0x21a9;
  t.arrowlefttophalf = 0x21bc;
  t.arrowleftbothalf = 0x21bd;
  t.arrownortheast = 0x2197;
  t.arrownorthwest = 0x2196;
  t.arrowrighttophalf = 0x21c0;
  t.arrowrightbothalf = 0x21c1;
  t.arrowsoutheast = 0x2198;
  t.arrowsouthwest = 0x2199;
  t.backslashbig = 0x2216;
  t.backslashBig = 0x2216;
  t.backslashBigg = 0x2216;
  t.backslashbigg = 0x2216;
  t.bardbl = 0x2016;
  t.bracehtipdownleft = 0xfe37;
  t.bracehtipdownright = 0xfe37;
  t.bracehtipupleft = 0xfe38;
  t.bracehtipupright = 0xfe38;
  t.braceleftBig = 0x007b;
  t.braceleftbig = 0x007b;
  t.braceleftbigg = 0x007b;
  t.braceleftBigg = 0x007b;
  t.bracerightBig = 0x007d;
  t.bracerightbig = 0x007d;
  t.bracerightbigg = 0x007d;
  t.bracerightBigg = 0x007d;
  t.bracketleftbig = 0x005b;
  t.bracketleftBig = 0x005b;
  t.bracketleftbigg = 0x005b;
  t.bracketleftBigg = 0x005b;
  t.bracketrightBig = 0x005d;
  t.bracketrightbig = 0x005d;
  t.bracketrightbigg = 0x005d;
  t.bracketrightBigg = 0x005d;
  t.ceilingleftbig = 0x2308;
  t.ceilingleftBig = 0x2308;
  t.ceilingleftBigg = 0x2308;
  t.ceilingleftbigg = 0x2308;
  t.ceilingrightbig = 0x2309;
  t.ceilingrightBig = 0x2309;
  t.ceilingrightbigg = 0x2309;
  t.ceilingrightBigg = 0x2309;
  t.circledotdisplay = 0x2299;
  t.circledottext = 0x2299;
  t.circlemultiplydisplay = 0x2297;
  t.circlemultiplytext = 0x2297;
  t.circleplusdisplay = 0x2295;
  t.circleplustext = 0x2295;
  t.contintegraldisplay = 0x222e;
  t.contintegraltext = 0x222e;
  t.coproductdisplay = 0x2210;
  t.coproducttext = 0x2210;
  t.floorleftBig = 0x230a;
  t.floorleftbig = 0x230a;
  t.floorleftbigg = 0x230a;
  t.floorleftBigg = 0x230a;
  t.floorrightbig = 0x230b;
  t.floorrightBig = 0x230b;
  t.floorrightBigg = 0x230b;
  t.floorrightbigg = 0x230b;
  t.hatwide = 0x0302;
  t.hatwider = 0x0302;
  t.hatwidest = 0x0302;
  t.intercal = 0x1d40;
  t.integraldisplay = 0x222b;
  t.integraltext = 0x222b;
  t.intersectiondisplay = 0x22c2;
  t.intersectiontext = 0x22c2;
  t.logicalanddisplay = 0x2227;
  t.logicalandtext = 0x2227;
  t.logicalordisplay = 0x2228;
  t.logicalortext = 0x2228;
  t.parenleftBig = 0x0028;
  t.parenleftbig = 0x0028;
  t.parenleftBigg = 0x0028;
  t.parenleftbigg = 0x0028;
  t.parenrightBig = 0x0029;
  t.parenrightbig = 0x0029;
  t.parenrightBigg = 0x0029;
  t.parenrightbigg = 0x0029;
  t.prime = 0x2032;
  t.productdisplay = 0x220f;
  t.producttext = 0x220f;
  t.radicalbig = 0x221a;
  t.radicalBig = 0x221a;
  t.radicalBigg = 0x221a;
  t.radicalbigg = 0x221a;
  t.radicalbt = 0x221a;
  t.radicaltp = 0x221a;
  t.radicalvertex = 0x221a;
  t.slashbig = 0x002f;
  t.slashBig = 0x002f;
  t.slashBigg = 0x002f;
  t.slashbigg = 0x002f;
  t.summationdisplay = 0x2211;
  t.summationtext = 0x2211;
  t.tildewide = 0x02dc;
  t.tildewider = 0x02dc;
  t.tildewidest = 0x02dc;
  t.uniondisplay = 0x22c3;
  t.unionmultidisplay = 0x228e;
  t.unionmultitext = 0x228e;
  t.unionsqdisplay = 0x2294;
  t.unionsqtext = 0x2294;
  t.uniontext = 0x22c3;
  t.vextenddouble = 0x2225;
  t.vextendsingle = 0x2223;
});
const getDingbatsGlyphsUnicode = getLookupTableFactory(function (t) {
  t.space = 0x0020;
  t.a1 = 0x2701;
  t.a2 = 0x2702;
  t.a202 = 0x2703;
  t.a3 = 0x2704;
  t.a4 = 0x260e;
  t.a5 = 0x2706;
  t.a119 = 0x2707;
  t.a118 = 0x2708;
  t.a117 = 0x2709;
  t.a11 = 0x261b;
  t.a12 = 0x261e;
  t.a13 = 0x270c;
  t.a14 = 0x270d;
  t.a15 = 0x270e;
  t.a16 = 0x270f;
  t.a105 = 0x2710;
  t.a17 = 0x2711;
  t.a18 = 0x2712;
  t.a19 = 0x2713;
  t.a20 = 0x2714;
  t.a21 = 0x2715;
  t.a22 = 0x2716;
  t.a23 = 0x2717;
  t.a24 = 0x2718;
  t.a25 = 0x2719;
  t.a26 = 0x271a;
  t.a27 = 0x271b;
  t.a28 = 0x271c;
  t.a6 = 0x271d;
  t.a7 = 0x271e;
  t.a8 = 0x271f;
  t.a9 = 0x2720;
  t.a10 = 0x2721;
  t.a29 = 0x2722;
  t.a30 = 0x2723;
  t.a31 = 0x2724;
  t.a32 = 0x2725;
  t.a33 = 0x2726;
  t.a34 = 0x2727;
  t.a35 = 0x2605;
  t.a36 = 0x2729;
  t.a37 = 0x272a;
  t.a38 = 0x272b;
  t.a39 = 0x272c;
  t.a40 = 0x272d;
  t.a41 = 0x272e;
  t.a42 = 0x272f;
  t.a43 = 0x2730;
  t.a44 = 0x2731;
  t.a45 = 0x2732;
  t.a46 = 0x2733;
  t.a47 = 0x2734;
  t.a48 = 0x2735;
  t.a49 = 0x2736;
  t.a50 = 0x2737;
  t.a51 = 0x2738;
  t.a52 = 0x2739;
  t.a53 = 0x273a;
  t.a54 = 0x273b;
  t.a55 = 0x273c;
  t.a56 = 0x273d;
  t.a57 = 0x273e;
  t.a58 = 0x273f;
  t.a59 = 0x2740;
  t.a60 = 0x2741;
  t.a61 = 0x2742;
  t.a62 = 0x2743;
  t.a63 = 0x2744;
  t.a64 = 0x2745;
  t.a65 = 0x2746;
  t.a66 = 0x2747;
  t.a67 = 0x2748;
  t.a68 = 0x2749;
  t.a69 = 0x274a;
  t.a70 = 0x274b;
  t.a71 = 0x25cf;
  t.a72 = 0x274d;
  t.a73 = 0x25a0;
  t.a74 = 0x274f;
  t.a203 = 0x2750;
  t.a75 = 0x2751;
  t.a204 = 0x2752;
  t.a76 = 0x25b2;
  t.a77 = 0x25bc;
  t.a78 = 0x25c6;
  t.a79 = 0x2756;
  t.a81 = 0x25d7;
  t.a82 = 0x2758;
  t.a83 = 0x2759;
  t.a84 = 0x275a;
  t.a97 = 0x275b;
  t.a98 = 0x275c;
  t.a99 = 0x275d;
  t.a100 = 0x275e;
  t.a101 = 0x2761;
  t.a102 = 0x2762;
  t.a103 = 0x2763;
  t.a104 = 0x2764;
  t.a106 = 0x2765;
  t.a107 = 0x2766;
  t.a108 = 0x2767;
  t.a112 = 0x2663;
  t.a111 = 0x2666;
  t.a110 = 0x2665;
  t.a109 = 0x2660;
  t.a120 = 0x2460;
  t.a121 = 0x2461;
  t.a122 = 0x2462;
  t.a123 = 0x2463;
  t.a124 = 0x2464;
  t.a125 = 0x2465;
  t.a126 = 0x2466;
  t.a127 = 0x2467;
  t.a128 = 0x2468;
  t.a129 = 0x2469;
  t.a130 = 0x2776;
  t.a131 = 0x2777;
  t.a132 = 0x2778;
  t.a133 = 0x2779;
  t.a134 = 0x277a;
  t.a135 = 0x277b;
  t.a136 = 0x277c;
  t.a137 = 0x277d;
  t.a138 = 0x277e;
  t.a139 = 0x277f;
  t.a140 = 0x2780;
  t.a141 = 0x2781;
  t.a142 = 0x2782;
  t.a143 = 0x2783;
  t.a144 = 0x2784;
  t.a145 = 0x2785;
  t.a146 = 0x2786;
  t.a147 = 0x2787;
  t.a148 = 0x2788;
  t.a149 = 0x2789;
  t.a150 = 0x278a;
  t.a151 = 0x278b;
  t.a152 = 0x278c;
  t.a153 = 0x278d;
  t.a154 = 0x278e;
  t.a155 = 0x278f;
  t.a156 = 0x2790;
  t.a157 = 0x2791;
  t.a158 = 0x2792;
  t.a159 = 0x2793;
  t.a160 = 0x2794;
  t.a161 = 0x2192;
  t.a163 = 0x2194;
  t.a164 = 0x2195;
  t.a196 = 0x2798;
  t.a165 = 0x2799;
  t.a192 = 0x279a;
  t.a166 = 0x279b;
  t.a167 = 0x279c;
  t.a168 = 0x279d;
  t.a169 = 0x279e;
  t.a170 = 0x279f;
  t.a171 = 0x27a0;
  t.a172 = 0x27a1;
  t.a173 = 0x27a2;
  t.a162 = 0x27a3;
  t.a174 = 0x27a4;
  t.a175 = 0x27a5;
  t.a176 = 0x27a6;
  t.a177 = 0x27a7;
  t.a178 = 0x27a8;
  t.a179 = 0x27a9;
  t.a193 = 0x27aa;
  t.a180 = 0x27ab;
  t.a199 = 0x27ac;
  t.a181 = 0x27ad;
  t.a200 = 0x27ae;
  t.a182 = 0x27af;
  t.a201 = 0x27b1;
  t.a183 = 0x27b2;
  t.a184 = 0x27b3;
  t.a197 = 0x27b4;
  t.a185 = 0x27b5;
  t.a194 = 0x27b6;
  t.a198 = 0x27b7;
  t.a186 = 0x27b8;
  t.a195 = 0x27b9;
  t.a187 = 0x27ba;
  t.a188 = 0x27bb;
  t.a189 = 0x27bc;
  t.a190 = 0x27bd;
  t.a191 = 0x27be;
  t.a89 = 0x2768;
  t.a90 = 0x2769;
  t.a93 = 0x276a;
  t.a94 = 0x276b;
  t.a91 = 0x276c;
  t.a92 = 0x276d;
  t.a205 = 0x276e;
  t.a85 = 0x276f;
  t.a206 = 0x2770;
  t.a86 = 0x2771;
  t.a87 = 0x2772;
  t.a88 = 0x2773;
  t.a95 = 0x2774;
  t.a96 = 0x2775;
  t[".notdef"] = 0x0000;
});

;// ./src/core/unicode.js

const getSpecialPUASymbols = getLookupTableFactory(function (t) {
  t[63721] = 0x00a9;
  t[63193] = 0x00a9;
  t[63720] = 0x00ae;
  t[63194] = 0x00ae;
  t[63722] = 0x2122;
  t[63195] = 0x2122;
  t[63729] = 0x23a7;
  t[63730] = 0x23a8;
  t[63731] = 0x23a9;
  t[63740] = 0x23ab;
  t[63741] = 0x23ac;
  t[63742] = 0x23ad;
  t[63726] = 0x23a1;
  t[63727] = 0x23a2;
  t[63728] = 0x23a3;
  t[63737] = 0x23a4;
  t[63738] = 0x23a5;
  t[63739] = 0x23a6;
  t[63723] = 0x239b;
  t[63724] = 0x239c;
  t[63725] = 0x239d;
  t[63734] = 0x239e;
  t[63735] = 0x239f;
  t[63736] = 0x23a0;
});
function mapSpecialUnicodeValues(code) {
  if (code >= 0xfff0 && code <= 0xffff) {
    return 0;
  } else if (code >= 0xf600 && code <= 0xf8ff) {
    return getSpecialPUASymbols()[code] || code;
  } else if (code === 0x00ad) {
    return 0x002d;
  }
  return code;
}
function getUnicodeForGlyph(name, glyphsUnicodeMap) {
  let unicode = glyphsUnicodeMap[name];
  if (unicode !== undefined) {
    return unicode;
  }
  if (!name) {
    return -1;
  }
  if (name[0] === "u") {
    const nameLen = name.length;
    let hexStr;
    if (nameLen === 7 && name[1] === "n" && name[2] === "i") {
      hexStr = name.substring(3);
    } else if (nameLen >= 5 && nameLen <= 7) {
      hexStr = name.substring(1);
    } else {
      return -1;
    }
    if (hexStr === hexStr.toUpperCase()) {
      unicode = parseInt(hexStr, 16);
      if (unicode >= 0) {
        return unicode;
      }
    }
  }
  return -1;
}
const UnicodeRanges = [[0x0000, 0x007f], [0x0080, 0x00ff], [0x0100, 0x017f], [0x0180, 0x024f], [0x0250, 0x02af, 0x1d00, 0x1d7f, 0x1d80, 0x1dbf], [0x02b0, 0x02ff, 0xa700, 0xa71f], [0x0300, 0x036f, 0x1dc0, 0x1dff], [0x0370, 0x03ff], [0x2c80, 0x2cff], [0x0400, 0x04ff, 0x0500, 0x052f, 0x2de0, 0x2dff, 0xa640, 0xa69f], [0x0530, 0x058f], [0x0590, 0x05ff], [0xa500, 0xa63f], [0x0600, 0x06ff, 0x0750, 0x077f], [0x07c0, 0x07ff], [0x0900, 0x097f], [0x0980, 0x09ff], [0x0a00, 0x0a7f], [0x0a80, 0x0aff], [0x0b00, 0x0b7f], [0x0b80, 0x0bff], [0x0c00, 0x0c7f], [0x0c80, 0x0cff], [0x0d00, 0x0d7f], [0x0e00, 0x0e7f], [0x0e80, 0x0eff], [0x10a0, 0x10ff, 0x2d00, 0x2d2f], [0x1b00, 0x1b7f], [0x1100, 0x11ff], [0x1e00, 0x1eff, 0x2c60, 0x2c7f, 0xa720, 0xa7ff], [0x1f00, 0x1fff], [0x2000, 0x206f, 0x2e00, 0x2e7f], [0x2070, 0x209f], [0x20a0, 0x20cf], [0x20d0, 0x20ff], [0x2100, 0x214f], [0x2150, 0x218f], [0x2190, 0x21ff, 0x27f0, 0x27ff, 0x2900, 0x297f, 0x2b00, 0x2bff], [0x2200, 0x22ff, 0x2a00, 0x2aff, 0x27c0, 0x27ef, 0x2980, 0x29ff], [0x2300, 0x23ff], [0x2400, 0x243f], [0x2440, 0x245f], [0x2460, 0x24ff], [0x2500, 0x257f], [0x2580, 0x259f], [0x25a0, 0x25ff], [0x2600, 0x26ff], [0x2700, 0x27bf], [0x3000, 0x303f], [0x3040, 0x309f], [0x30a0, 0x30ff, 0x31f0, 0x31ff], [0x3100, 0x312f, 0x31a0, 0x31bf], [0x3130, 0x318f], [0xa840, 0xa87f], [0x3200, 0x32ff], [0x3300, 0x33ff], [0xac00, 0xd7af], [0xd800, 0xdfff], [0x10900, 0x1091f], [0x4e00, 0x9fff, 0x2e80, 0x2eff, 0x2f00, 0x2fdf, 0x2ff0, 0x2fff, 0x3400, 0x4dbf, 0x20000, 0x2a6df, 0x3190, 0x319f], [0xe000, 0xf8ff], [0x31c0, 0x31ef, 0xf900, 0xfaff, 0x2f800, 0x2fa1f], [0xfb00, 0xfb4f], [0xfb50, 0xfdff], [0xfe20, 0xfe2f], [0xfe10, 0xfe1f], [0xfe50, 0xfe6f], [0xfe70, 0xfeff], [0xff00, 0xffef], [0xfff0, 0xffff], [0x0f00, 0x0fff], [0x0700, 0x074f], [0x0780, 0x07bf], [0x0d80, 0x0dff], [0x1000, 0x109f], [0x1200, 0x137f, 0x1380, 0x139f, 0x2d80, 0x2ddf], [0x13a0, 0x13ff], [0x1400, 0x167f], [0x1680, 0x169f], [0x16a0, 0x16ff], [0x1780, 0x17ff], [0x1800, 0x18af], [0x2800, 0x28ff], [0xa000, 0xa48f], [0x1700, 0x171f, 0x1720, 0x173f, 0x1740, 0x175f, 0x1760, 0x177f], [0x10300, 0x1032f], [0x10330, 0x1034f], [0x10400, 0x1044f], [0x1d000, 0x1d0ff, 0x1d100, 0x1d1ff, 0x1d200, 0x1d24f], [0x1d400, 0x1d7ff], [0xff000, 0xffffd], [0xfe00, 0xfe0f, 0xe0100, 0xe01ef], [0xe0000, 0xe007f], [0x1900, 0x194f], [0x1950, 0x197f], [0x1980, 0x19df], [0x1a00, 0x1a1f], [0x2c00, 0x2c5f], [0x2d30, 0x2d7f], [0x4dc0, 0x4dff], [0xa800, 0xa82f], [0x10000, 0x1007f, 0x10080, 0x100ff, 0x10100, 0x1013f], [0x10140, 0x1018f], [0x10380, 0x1039f], [0x103a0, 0x103df], [0x10450, 0x1047f], [0x10480, 0x104af], [0x10800, 0x1083f], [0x10a00, 0x10a5f], [0x1d300, 0x1d35f], [0x12000, 0x123ff, 0x12400, 0x1247f], [0x1d360, 0x1d37f], [0x1b80, 0x1bbf], [0x1c00, 0x1c4f], [0x1c50, 0x1c7f], [0xa880, 0xa8df], [0xa900, 0xa92f], [0xa930, 0xa95f], [0xaa00, 0xaa5f], [0x10190, 0x101cf], [0x101d0, 0x101ff], [0x102a0, 0x102df, 0x10280, 0x1029f, 0x10920, 0x1093f], [0x1f030, 0x1f09f, 0x1f000, 0x1f02f]];
function getUnicodeRangeFor(value, lastPosition = -1) {
  if (lastPosition !== -1) {
    const range = UnicodeRanges[lastPosition];
    for (let i = 0, ii = range.length; i < ii; i += 2) {
      if (value >= range[i] && value <= range[i + 1]) {
        return lastPosition;
      }
    }
  }
  for (let i = 0, ii = UnicodeRanges.length; i < ii; i++) {
    const range = UnicodeRanges[i];
    for (let j = 0, jj = range.length; j < jj; j += 2) {
      if (value >= range[j] && value <= range[j + 1]) {
        return i;
      }
    }
  }
  return -1;
}
const SpecialCharRegExp = new RegExp("^(\\s)|(\\p{Mn})|(\\p{Cf})$", "u");
const CategoryCache = new Map();
function getCharUnicodeCategory(char) {
  const cachedCategory = CategoryCache.get(char);
  if (cachedCategory) {
    return cachedCategory;
  }
  const groups = char.match(SpecialCharRegExp);
  const category = {
    isWhitespace: !!groups?.[1],
    isZeroWidthDiacritic: !!groups?.[2],
    isInvisibleFormatMark: !!groups?.[3]
  };
  CategoryCache.set(char, category);
  return category;
}
function clearUnicodeCaches() {
  CategoryCache.clear();
}

;// ./src/core/fonts_utils.js














const SEAC_ANALYSIS_ENABLED = true;
const FontFlags = {
  FixedPitch: 1,
  Serif: 2,
  Symbolic: 4,
  Script: 8,
  Nonsymbolic: 32,
  Italic: 64,
  AllCap: 65536,
  SmallCap: 131072,
  ForceBold: 262144
};
const MacStandardGlyphOrdering = [".notdef", ".null", "nonmarkingreturn", "space", "exclam", "quotedbl", "numbersign", "dollar", "percent", "ampersand", "quotesingle", "parenleft", "parenright", "asterisk", "plus", "comma", "hyphen", "period", "slash", "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "colon", "semicolon", "less", "equal", "greater", "question", "at", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "bracketleft", "backslash", "bracketright", "asciicircum", "underscore", "grave", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "braceleft", "bar", "braceright", "asciitilde", "Adieresis", "Aring", "Ccedilla", "Eacute", "Ntilde", "Odieresis", "Udieresis", "aacute", "agrave", "acircumflex", "adieresis", "atilde", "aring", "ccedilla", "eacute", "egrave", "ecircumflex", "edieresis", "iacute", "igrave", "icircumflex", "idieresis", "ntilde", "oacute", "ograve", "ocircumflex", "odieresis", "otilde", "uacute", "ugrave", "ucircumflex", "udieresis", "dagger", "degree", "cent", "sterling", "section", "bullet", "paragraph", "germandbls", "registered", "copyright", "trademark", "acute", "dieresis", "notequal", "AE", "Oslash", "infinity", "plusminus", "lessequal", "greaterequal", "yen", "mu", "partialdiff", "summation", "product", "pi", "integral", "ordfeminine", "ordmasculine", "Omega", "ae", "oslash", "questiondown", "exclamdown", "logicalnot", "radical", "florin", "approxequal", "Delta", "guillemotleft", "guillemotright", "ellipsis", "nonbreakingspace", "Agrave", "Atilde", "Otilde", "OE", "oe", "endash", "emdash", "quotedblleft", "quotedblright", "quoteleft", "quoteright", "divide", "lozenge", "ydieresis", "Ydieresis", "fraction", "currency", "guilsinglleft", "guilsinglright", "fi", "fl", "daggerdbl", "periodcentered", "quotesinglbase", "quotedblbase", "perthousand", "Acircumflex", "Ecircumflex", "Aacute", "Edieresis", "Egrave", "Iacute", "Icircumflex", "Idieresis", "Igrave", "Oacute", "Ocircumflex", "apple", "Ograve", "Uacute", "Ucircumflex", "Ugrave", "dotlessi", "circumflex", "tilde", "macron", "breve", "dotaccent", "ring", "cedilla", "hungarumlaut", "ogonek", "caron", "Lslash", "lslash", "Scaron", "scaron", "Zcaron", "zcaron", "brokenbar", "Eth", "eth", "Yacute", "yacute", "Thorn", "thorn", "minus", "multiply", "onesuperior", "twosuperior", "threesuperior", "onehalf", "onequarter", "threequarters", "franc", "Gbreve", "gbreve", "Idotaccent", "Scedilla", "scedilla", "Cacute", "cacute", "Ccaron", "ccaron", "dcroat"];
function recoverGlyphName(name, glyphsUnicodeMap) {
  if (glyphsUnicodeMap[name] !== undefined) {
    return name;
  }
  const unicode = getUnicodeForGlyph(name, glyphsUnicodeMap);
  if (unicode !== -1) {
    for (const key in glyphsUnicodeMap) {
      if (glyphsUnicodeMap[key] === unicode) {
        return key;
      }
    }
  }
  info("Unable to recover a standard glyph name for: " + name);
  return name;
}
function type1FontGlyphMapping(properties, builtInEncoding, glyphNames) {
  const charCodeToGlyphId = Object.create(null);
  let glyphId, charCode, baseEncoding;
  const isSymbolicFont = !!(properties.flags & FontFlags.Symbolic);
  if (properties.isInternalFont) {
    baseEncoding = builtInEncoding;
    for (charCode = 0; charCode < baseEncoding.length; charCode++) {
      glyphId = glyphNames.indexOf(baseEncoding[charCode]);
      charCodeToGlyphId[charCode] = glyphId >= 0 ? glyphId : 0;
    }
  } else if (properties.baseEncodingName) {
    baseEncoding = getEncoding(properties.baseEncodingName);
    for (charCode = 0; charCode < baseEncoding.length; charCode++) {
      glyphId = glyphNames.indexOf(baseEncoding[charCode]);
      charCodeToGlyphId[charCode] = glyphId >= 0 ? glyphId : 0;
    }
  } else if (isSymbolicFont) {
    for (charCode in builtInEncoding) {
      charCodeToGlyphId[charCode] = builtInEncoding[charCode];
    }
  } else {
    baseEncoding = StandardEncoding;
    for (charCode = 0; charCode < baseEncoding.length; charCode++) {
      glyphId = glyphNames.indexOf(baseEncoding[charCode]);
      charCodeToGlyphId[charCode] = glyphId >= 0 ? glyphId : 0;
    }
  }
  const differences = properties.differences;
  let glyphsUnicodeMap;
  if (differences) {
    for (charCode in differences) {
      const glyphName = differences[charCode];
      glyphId = glyphNames.indexOf(glyphName);
      if (glyphId === -1) {
        if (!glyphsUnicodeMap) {
          glyphsUnicodeMap = getGlyphsUnicode();
        }
        const standardGlyphName = recoverGlyphName(glyphName, glyphsUnicodeMap);
        if (standardGlyphName !== glyphName) {
          glyphId = glyphNames.indexOf(standardGlyphName);
        }
      }
      charCodeToGlyphId[charCode] = glyphId >= 0 ? glyphId : 0;
    }
  }
  return charCodeToGlyphId;
}
function normalizeFontName(name) {
  return name.replaceAll(/[,_]/g, "-").replaceAll(/\s/g, "");
}
const getVerticalPresentationForm = getLookupTableFactory(t => {
  t[0x2013] = 0xfe32;
  t[0x2014] = 0xfe31;
  t[0x2025] = 0xfe30;
  t[0x2026] = 0xfe19;
  t[0x3001] = 0xfe11;
  t[0x3002] = 0xfe12;
  t[0x3008] = 0xfe3f;
  t[0x3009] = 0xfe40;
  t[0x300a] = 0xfe3d;
  t[0x300b] = 0xfe3e;
  t[0x300c] = 0xfe41;
  t[0x300d] = 0xfe42;
  t[0x300e] = 0xfe43;
  t[0x300f] = 0xfe44;
  t[0x3010] = 0xfe3b;
  t[0x3011] = 0xfe3c;
  t[0x3014] = 0xfe39;
  t[0x3015] = 0xfe3a;
  t[0x3016] = 0xfe17;
  t[0x3017] = 0xfe18;
  t[0xfe4f] = 0xfe34;
  t[0xff01] = 0xfe15;
  t[0xff08] = 0xfe35;
  t[0xff09] = 0xfe36;
  t[0xff0c] = 0xfe10;
  t[0xff1a] = 0xfe13;
  t[0xff1b] = 0xfe14;
  t[0xff1f] = 0xfe16;
  t[0xff3b] = 0xfe47;
  t[0xff3d] = 0xfe48;
  t[0xff3f] = 0xfe33;
  t[0xff5b] = 0xfe37;
  t[0xff5d] = 0xfe38;
});
const MAX_SIZE_TO_COMPILE = 1000;
function compileType3Glyph({
  data: img,
  width,
  height
}) {
  if (width > MAX_SIZE_TO_COMPILE || height > MAX_SIZE_TO_COMPILE) {
    return null;
  }
  const POINT_TO_PROCESS_LIMIT = 1000;
  const POINT_TYPES = new Uint8Array([0, 2, 4, 0, 1, 0, 5, 4, 8, 10, 0, 8, 0, 2, 1, 0]);
  const width1 = width + 1;
  const points = new Uint8Array(width1 * (height + 1));
  let i, j, j0;
  const lineSize = width + 7 & ~7;
  const data = new Uint8Array(lineSize * height);
  let pos = 0;
  for (const elem of img) {
    let mask = 128;
    while (mask > 0) {
      data[pos++] = elem & mask ? 0 : 255;
      mask >>= 1;
    }
  }
  let count = 0;
  pos = 0;
  if (data[pos] !== 0) {
    points[0] = 1;
    ++count;
  }
  for (j = 1; j < width; j++) {
    if (data[pos] !== data[pos + 1]) {
      points[j] = data[pos] ? 2 : 1;
      ++count;
    }
    pos++;
  }
  if (data[pos] !== 0) {
    points[j] = 2;
    ++count;
  }
  for (i = 1; i < height; i++) {
    pos = i * lineSize;
    j0 = i * width1;
    if (data[pos - lineSize] !== data[pos]) {
      points[j0] = data[pos] ? 1 : 8;
      ++count;
    }
    let sum = (data[pos] ? 4 : 0) + (data[pos - lineSize] ? 8 : 0);
    for (j = 1; j < width; j++) {
      sum = (sum >> 2) + (data[pos + 1] ? 4 : 0) + (data[pos - lineSize + 1] ? 8 : 0);
      if (POINT_TYPES[sum]) {
        points[j0 + j] = POINT_TYPES[sum];
        ++count;
      }
      pos++;
    }
    if (data[pos - lineSize] !== data[pos]) {
      points[j0 + j] = data[pos] ? 2 : 4;
      ++count;
    }
    if (count > POINT_TO_PROCESS_LIMIT) {
      return null;
    }
  }
  pos = lineSize * (height - 1);
  j0 = i * width1;
  if (data[pos] !== 0) {
    points[j0] = 8;
    ++count;
  }
  for (j = 1; j < width; j++) {
    if (data[pos] !== data[pos + 1]) {
      points[j0 + j] = data[pos] ? 4 : 8;
      ++count;
    }
    pos++;
  }
  if (data[pos] !== 0) {
    points[j0 + j] = 4;
    ++count;
  }
  if (count > POINT_TO_PROCESS_LIMIT) {
    return null;
  }
  const steps = new Int32Array([0, width1, -1, 0, -width1, 0, 0, 0, 1]);
  const pathBuf = [];
  const {
    a,
    b,
    c,
    d,
    e,
    f
  } = new DOMMatrix().scaleSelf(1 / width, -1 / height).translateSelf(0, -height);
  for (i = 0; count && i <= height; i++) {
    let p = i * width1;
    const end = p + width;
    while (p < end && !points[p]) {
      p++;
    }
    if (p === end) {
      continue;
    }
    let x = p % width1;
    let y = i;
    pathBuf.push(DrawOPS.moveTo, a * x + c * y + e, b * x + d * y + f);
    const p0 = p;
    let type = points[p];
    do {
      const step = steps[type];
      do {
        p += step;
      } while (!points[p]);
      const pp = points[p];
      if (pp !== 5 && pp !== 10) {
        type = pp;
        points[p] = 0;
      } else {
        type = pp & 0x33 * type >> 4;
        points[p] &= type >> 2 | type << 2;
      }
      x = p % width1;
      y = p / width1 | 0;
      pathBuf.push(DrawOPS.lineTo, a * x + c * y + e, b * x + d * y + f);
      if (!points[p]) {
        --count;
      }
    } while (p0 !== p);
    --i;
  }
  return [OPS.rawFillPath, [new Float32Array(pathBuf)], new Float32Array([0, 0, width, height])];
}

// EXTERNAL MODULE: ./node_modules/core-js/modules/es.iterator.to-array.js
var es_iterator_to_array = __webpack_require__(1806);
;// ./src/core/charsets.js
const ISOAdobeCharset = [".notdef", "space", "exclam", "quotedbl", "numbersign", "dollar", "percent", "ampersand", "quoteright", "parenleft", "parenright", "asterisk", "plus", "comma", "hyphen", "period", "slash", "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "colon", "semicolon", "less", "equal", "greater", "question", "at", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "bracketleft", "backslash", "bracketright", "asciicircum", "underscore", "quoteleft", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "braceleft", "bar", "braceright", "asciitilde", "exclamdown", "cent", "sterling", "fraction", "yen", "florin", "section", "currency", "quotesingle", "quotedblleft", "guillemotleft", "guilsinglleft", "guilsinglright", "fi", "fl", "endash", "dagger", "daggerdbl", "periodcentered", "paragraph", "bullet", "quotesinglbase", "quotedblbase", "quotedblright", "guillemotright", "ellipsis", "perthousand", "questiondown", "grave", "acute", "circumflex", "tilde", "macron", "breve", "dotaccent", "dieresis", "ring", "cedilla", "hungarumlaut", "ogonek", "caron", "emdash", "AE", "ordfeminine", "Lslash", "Oslash", "OE", "ordmasculine", "ae", "dotlessi", "lslash", "oslash", "oe", "germandbls", "onesuperior", "logicalnot", "mu", "trademark", "Eth", "onehalf", "plusminus", "Thorn", "onequarter", "divide", "brokenbar", "degree", "thorn", "threequarters", "twosuperior", "registered", "minus", "eth", "multiply", "threesuperior", "copyright", "Aacute", "Acircumflex", "Adieresis", "Agrave", "Aring", "Atilde", "Ccedilla", "Eacute", "Ecircumflex", "Edieresis", "Egrave", "Iacute", "Icircumflex", "Idieresis", "Igrave", "Ntilde", "Oacute", "Ocircumflex", "Odieresis", "Ograve", "Otilde", "Scaron", "Uacute", "Ucircumflex", "Udieresis", "Ugrave", "Yacute", "Ydieresis", "Zcaron", "aacute", "acircumflex", "adieresis", "agrave", "aring", "atilde", "ccedilla", "eacute", "ecircumflex", "edieresis", "egrave", "iacute", "icircumflex", "idieresis", "igrave", "ntilde", "oacute", "ocircumflex", "odieresis", "ograve", "otilde", "scaron", "uacute", "ucircumflex", "udieresis", "ugrave", "yacute", "ydieresis", "zcaron"];
const ExpertCharset = [".notdef", "space", "exclamsmall", "Hungarumlautsmall", "dollaroldstyle", "dollarsuperior", "ampersandsmall", "Acutesmall", "parenleftsuperior", "parenrightsuperior", "twodotenleader", "onedotenleader", "comma", "hyphen", "period", "fraction", "zerooldstyle", "oneoldstyle", "twooldstyle", "threeoldstyle", "fouroldstyle", "fiveoldstyle", "sixoldstyle", "sevenoldstyle", "eightoldstyle", "nineoldstyle", "colon", "semicolon", "commasuperior", "threequartersemdash", "periodsuperior", "questionsmall", "asuperior", "bsuperior", "centsuperior", "dsuperior", "esuperior", "isuperior", "lsuperior", "msuperior", "nsuperior", "osuperior", "rsuperior", "ssuperior", "tsuperior", "ff", "fi", "fl", "ffi", "ffl", "parenleftinferior", "parenrightinferior", "Circumflexsmall", "hyphensuperior", "Gravesmall", "Asmall", "Bsmall", "Csmall", "Dsmall", "Esmall", "Fsmall", "Gsmall", "Hsmall", "Ismall", "Jsmall", "Ksmall", "Lsmall", "Msmall", "Nsmall", "Osmall", "Psmall", "Qsmall", "Rsmall", "Ssmall", "Tsmall", "Usmall", "Vsmall", "Wsmall", "Xsmall", "Ysmall", "Zsmall", "colonmonetary", "onefitted", "rupiah", "Tildesmall", "exclamdownsmall", "centoldstyle", "Lslashsmall", "Scaronsmall", "Zcaronsmall", "Dieresissmall", "Brevesmall", "Caronsmall", "Dotaccentsmall", "Macronsmall", "figuredash", "hypheninferior", "Ogoneksmall", "Ringsmall", "Cedillasmall", "onequarter", "onehalf", "threequarters", "questiondownsmall", "oneeighth", "threeeighths", "fiveeighths", "seveneighths", "onethird", "twothirds", "zerosuperior", "onesuperior", "twosuperior", "threesuperior", "foursuperior", "fivesuperior", "sixsuperior", "sevensuperior", "eightsuperior", "ninesuperior", "zeroinferior", "oneinferior", "twoinferior", "threeinferior", "fourinferior", "fiveinferior", "sixinferior", "seveninferior", "eightinferior", "nineinferior", "centinferior", "dollarinferior", "periodinferior", "commainferior", "Agravesmall", "Aacutesmall", "Acircumflexsmall", "Atildesmall", "Adieresissmall", "Aringsmall", "AEsmall", "Ccedillasmall", "Egravesmall", "Eacutesmall", "Ecircumflexsmall", "Edieresissmall", "Igravesmall", "Iacutesmall", "Icircumflexsmall", "Idieresissmall", "Ethsmall", "Ntildesmall", "Ogravesmall", "Oacutesmall", "Ocircumflexsmall", "Otildesmall", "Odieresissmall", "OEsmall", "Oslashsmall", "Ugravesmall", "Uacutesmall", "Ucircumflexsmall", "Udieresissmall", "Yacutesmall", "Thornsmall", "Ydieresissmall"];
const ExpertSubsetCharset = [".notdef", "space", "dollaroldstyle", "dollarsuperior", "parenleftsuperior", "parenrightsuperior", "twodotenleader", "onedotenleader", "comma", "hyphen", "period", "fraction", "zerooldstyle", "oneoldstyle", "twooldstyle", "threeoldstyle", "fouroldstyle", "fiveoldstyle", "sixoldstyle", "sevenoldstyle", "eightoldstyle", "nineoldstyle", "colon", "semicolon", "commasuperior", "threequartersemdash", "periodsuperior", "asuperior", "bsuperior", "centsuperior", "dsuperior", "esuperior", "isuperior", "lsuperior", "msuperior", "nsuperior", "osuperior", "rsuperior", "ssuperior", "tsuperior", "ff", "fi", "fl", "ffi", "ffl", "parenleftinferior", "parenrightinferior", "hyphensuperior", "colonmonetary", "onefitted", "rupiah", "centoldstyle", "figuredash", "hypheninferior", "onequarter", "onehalf", "threequarters", "oneeighth", "threeeighths", "fiveeighths", "seveneighths", "onethird", "twothirds", "zerosuperior", "onesuperior", "twosuperior", "threesuperior", "foursuperior", "fivesuperior", "sixsuperior", "sevensuperior", "eightsuperior", "ninesuperior", "zeroinferior", "oneinferior", "twoinferior", "threeinferior", "fourinferior", "fiveinferior", "sixinferior", "seveninferior", "eightinferior", "nineinferior", "centinferior", "dollarinferior", "periodinferior", "commainferior"];

;// ./src/core/cff_parser.js












const MAX_SUBR_NESTING = 10;
const CFFStandardStrings = [".notdef", "space", "exclam", "quotedbl", "numbersign", "dollar", "percent", "ampersand", "quoteright", "parenleft", "parenright", "asterisk", "plus", "comma", "hyphen", "period", "slash", "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "colon", "semicolon", "less", "equal", "greater", "question", "at", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "bracketleft", "backslash", "bracketright", "asciicircum", "underscore", "quoteleft", "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "braceleft", "bar", "braceright", "asciitilde", "exclamdown", "cent", "sterling", "fraction", "yen", "florin", "section", "currency", "quotesingle", "quotedblleft", "guillemotleft", "guilsinglleft", "guilsinglright", "fi", "fl", "endash", "dagger", "daggerdbl", "periodcentered", "paragraph", "bullet", "quotesinglbase", "quotedblbase", "quotedblright", "guillemotright", "ellipsis", "perthousand", "questiondown", "grave", "acute", "circumflex", "tilde", "macron", "breve", "dotaccent", "dieresis", "ring", "cedilla", "hungarumlaut", "ogonek", "caron", "emdash", "AE", "ordfeminine", "Lslash", "Oslash", "OE", "ordmasculine", "ae", "dotlessi", "lslash", "oslash", "oe", "germandbls", "onesuperior", "logicalnot", "mu", "trademark", "Eth", "onehalf", "plusminus", "Thorn", "onequarter", "divide", "brokenbar", "degree", "thorn", "threequarters", "twosuperior", "registered", "minus", "eth", "multiply", "threesuperior", "copyright", "Aacute", "Acircumflex", "Adieresis", "Agrave", "Aring", "Atilde", "Ccedilla", "Eacute", "Ecircumflex", "Edieresis", "Egrave", "Iacute", "Icircumflex", "Idieresis", "Igrave", "Ntilde", "Oacute", "Ocircumflex", "Odieresis", "Ograve", "Otilde", "Scaron", "Uacute", "Ucircumflex", "Udieresis", "Ugrave", "Yacute", "Ydieresis", "Zcaron", "aacute", "acircumflex", "adieresis", "agrave", "aring", "atilde", "ccedilla", "eacute", "ecircumflex", "edieresis", "egrave", "iacute", "icircumflex", "idieresis", "igrave", "ntilde", "oacute", "ocircumflex", "odieresis", "ograve", "otilde", "scaron", "uacute", "ucircumflex", "udieresis", "ugrave", "yacute", "ydieresis", "zcaron", "exclamsmall", "Hungarumlautsmall", "dollaroldstyle", "dollarsuperior", "ampersandsmall", "Acutesmall", "parenleftsuperior", "parenrightsuperior", "twodotenleader", "onedotenleader", "zerooldstyle", "oneoldstyle", "twooldstyle", "threeoldstyle", "fouroldstyle", "fiveoldstyle", "sixoldstyle", "sevenoldstyle", "eightoldstyle", "nineoldstyle", "commasuperior", "threequartersemdash", "periodsuperior", "questionsmall", "asuperior", "bsuperior", "centsuperior", "dsuperior", "esuperior", "isuperior", "lsuperior", "msuperior", "nsuperior", "osuperior", "rsuperior", "ssuperior", "tsuperior", "ff", "ffi", "ffl", "parenleftinferior", "parenrightinferior", "Circumflexsmall", "hyphensuperior", "Gravesmall", "Asmall", "Bsmall", "Csmall", "Dsmall", "Esmall", "Fsmall", "Gsmall", "Hsmall", "Ismall", "Jsmall", "Ksmall", "Lsmall", "Msmall", "Nsmall", "Osmall", "Psmall", "Qsmall", "Rsmall", "Ssmall", "Tsmall", "Usmall", "Vsmall", "Wsmall", "Xsmall", "Ysmall", "Zsmall", "colonmonetary", "onefitted", "rupiah", "Tildesmall", "exclamdownsmall", "centoldstyle", "Lslashsmall", "Scaronsmall", "Zcaronsmall", "Dieresissmall", "Brevesmall", "Caronsmall", "Dotaccentsmall", "Macronsmall", "figuredash", "hypheninferior", "Ogoneksmall", "Ringsmall", "Cedillasmall", "questiondownsmall", "oneeighth", "threeeighths", "fiveeighths", "seveneighths", "onethird", "twothirds", "zerosuperior", "foursuperior", "fivesuperior", "sixsuperior", "sevensuperior", "eightsuperior", "ninesuperior", "zeroinferior", "oneinferior", "twoinferior", "threeinferior", "fourinferior", "fiveinferior", "sixinferior", "seveninferior", "eightinferior", "nineinferior", "centinferior", "dollarinferior", "periodinferior", "commainferior", "Agravesmall", "Aacutesmall", "Acircumflexsmall", "Atildesmall", "Adieresissmall", "Aringsmall", "AEsmall", "Ccedillasmall", "Egravesmall", "Eacutesmall", "Ecircumflexsmall", "Edieresissmall", "Igravesmall", "Iacutesmall", "Icircumflexsmall", "Idieresissmall", "Ethsmall", "Ntildesmall", "Ogravesmall", "Oacutesmall", "Ocircumflexsmall", "Otildesmall", "Odieresissmall", "OEsmall", "Oslashsmall", "Ugravesmall", "Uacutesmall", "Ucircumflexsmall", "Udieresissmall", "Yacutesmall", "Thornsmall", "Ydieresissmall", "001.000", "001.001", "001.002", "001.003", "Black", "Bold", "Book", "Light", "Medium", "Regular", "Roman", "Semibold"];
const NUM_STANDARD_CFF_STRINGS = 391;
const CharstringValidationData = [null, {
  id: "hstem",
  min: 2,
  stackClearing: true,
  stem: true
}, null, {
  id: "vstem",
  min: 2,
  stackClearing: true,
  stem: true
}, {
  id: "vmoveto",
  min: 1,
  stackClearing: true
}, {
  id: "rlineto",
  min: 2,
  resetStack: true
}, {
  id: "hlineto",
  min: 1,
  resetStack: true
}, {
  id: "vlineto",
  min: 1,
  resetStack: true
}, {
  id: "rrcurveto",
  min: 6,
  resetStack: true
}, null, {
  id: "callsubr",
  min: 1,
  undefStack: true
}, {
  id: "return",
  min: 0,
  undefStack: true
}, null, null, {
  id: "endchar",
  min: 0,
  stackClearing: true
}, null, null, null, {
  id: "hstemhm",
  min: 2,
  stackClearing: true,
  stem: true
}, {
  id: "hintmask",
  min: 0,
  stackClearing: true
}, {
  id: "cntrmask",
  min: 0,
  stackClearing: true
}, {
  id: "rmoveto",
  min: 2,
  stackClearing: true
}, {
  id: "hmoveto",
  min: 1,
  stackClearing: true
}, {
  id: "vstemhm",
  min: 2,
  stackClearing: true,
  stem: true
}, {
  id: "rcurveline",
  min: 8,
  resetStack: true
}, {
  id: "rlinecurve",
  min: 8,
  resetStack: true
}, {
  id: "vvcurveto",
  min: 4,
  resetStack: true
}, {
  id: "hhcurveto",
  min: 4,
  resetStack: true
}, null, {
  id: "callgsubr",
  min: 1,
  undefStack: true
}, {
  id: "vhcurveto",
  min: 4,
  resetStack: true
}, {
  id: "hvcurveto",
  min: 4,
  resetStack: true
}];
const CharstringValidationData12 = [null, null, null, {
  id: "and",
  min: 2,
  stackDelta: -1
}, {
  id: "or",
  min: 2,
  stackDelta: -1
}, {
  id: "not",
  min: 1,
  stackDelta: 0
}, null, null, null, {
  id: "abs",
  min: 1,
  stackDelta: 0
}, {
  id: "add",
  min: 2,
  stackDelta: -1,
  stackFn(stack, index) {
    stack[index - 2] = stack[index - 2] + stack[index - 1];
  }
}, {
  id: "sub",
  min: 2,
  stackDelta: -1,
  stackFn(stack, index) {
    stack[index - 2] = stack[index - 2] - stack[index - 1];
  }
}, {
  id: "div",
  min: 2,
  stackDelta: -1,
  stackFn(stack, index) {
    stack[index - 2] = stack[index - 2] / stack[index - 1];
  }
}, null, {
  id: "neg",
  min: 1,
  stackDelta: 0,
  stackFn(stack, index) {
    stack[index - 1] = -stack[index - 1];
  }
}, {
  id: "eq",
  min: 2,
  stackDelta: -1
}, null, null, {
  id: "drop",
  min: 1,
  stackDelta: -1
}, null, {
  id: "put",
  min: 2,
  stackDelta: -2
}, {
  id: "get",
  min: 1,
  stackDelta: 0
}, {
  id: "ifelse",
  min: 4,
  stackDelta: -3
}, {
  id: "random",
  min: 0,
  stackDelta: 1
}, {
  id: "mul",
  min: 2,
  stackDelta: -1,
  stackFn(stack, index) {
    stack[index - 2] = stack[index - 2] * stack[index - 1];
  }
}, null, {
  id: "sqrt",
  min: 1,
  stackDelta: 0
}, {
  id: "dup",
  min: 1,
  stackDelta: 1
}, {
  id: "exch",
  min: 2,
  stackDelta: 0
}, {
  id: "index",
  min: 2,
  stackDelta: 0
}, {
  id: "roll",
  min: 3,
  stackDelta: -2
}, null, null, null, {
  id: "hflex",
  min: 7,
  resetStack: true
}, {
  id: "flex",
  min: 13,
  resetStack: true
}, {
  id: "hflex1",
  min: 9,
  resetStack: true
}, {
  id: "flex1",
  min: 11,
  resetStack: true
}];
class CFFParser {
  constructor(file, properties, seacAnalysisEnabled) {
    this.bytes = file.getBytes();
    this.properties = properties;
    this.seacAnalysisEnabled = !!seacAnalysisEnabled;
  }
  parse() {
    const properties = this.properties;
    const cff = new CFF();
    this.cff = cff;
    const header = this.parseHeader();
    const nameIndex = this.parseIndex(header.endPos);
    const topDictIndex = this.parseIndex(nameIndex.endPos);
    const stringIndex = this.parseIndex(topDictIndex.endPos);
    const globalSubrIndex = this.parseIndex(stringIndex.endPos);
    const topDictParsed = this.parseDict(topDictIndex.obj.get(0));
    const topDict = this.createDict(CFFTopDict, topDictParsed, cff.strings);
    cff.header = header.obj;
    cff.names = this.parseNameIndex(nameIndex.obj);
    cff.strings = this.parseStringIndex(stringIndex.obj);
    cff.topDict = topDict;
    cff.globalSubrIndex = globalSubrIndex.obj;
    this.parsePrivateDict(cff.topDict);
    cff.isCIDFont = topDict.hasName("ROS");
    const charStringOffset = topDict.getByName("CharStrings");
    const charStringIndex = this.parseIndex(charStringOffset).obj;
    const fontMatrix = topDict.getByName("FontMatrix");
    if (fontMatrix) {
      properties.fontMatrix = fontMatrix;
    }
    const fontBBox = topDict.getByName("FontBBox");
    if (fontBBox) {
      properties.ascent = Math.max(fontBBox[3], fontBBox[1]);
      properties.descent = Math.min(fontBBox[1], fontBBox[3]);
      properties.ascentScaled = true;
    }
    let charset, encoding;
    if (cff.isCIDFont) {
      const fdArrayIndex = this.parseIndex(topDict.getByName("FDArray")).obj;
      for (let i = 0, ii = fdArrayIndex.count; i < ii; ++i) {
        const dictRaw = fdArrayIndex.get(i);
        const fontDict = this.createDict(CFFTopDict, this.parseDict(dictRaw), cff.strings);
        this.parsePrivateDict(fontDict);
        cff.fdArray.push(fontDict);
      }
      encoding = null;
      charset = this.parseCharsets(topDict.getByName("charset"), charStringIndex.count, cff.strings, true);
      cff.fdSelect = this.parseFDSelect(topDict.getByName("FDSelect"), charStringIndex.count);
    } else {
      charset = this.parseCharsets(topDict.getByName("charset"), charStringIndex.count, cff.strings, false);
      encoding = this.parseEncoding(topDict.getByName("Encoding"), properties, cff.strings, charset.charset);
    }
    cff.charset = charset;
    cff.encoding = encoding;
    const charStringsAndSeacs = this.parseCharStrings({
      charStrings: charStringIndex,
      localSubrIndex: topDict.privateDict.subrsIndex,
      globalSubrIndex: globalSubrIndex.obj,
      fdSelect: cff.fdSelect,
      fdArray: cff.fdArray,
      privateDict: topDict.privateDict
    });
    cff.charStrings = charStringsAndSeacs.charStrings;
    cff.seacs = charStringsAndSeacs.seacs;
    cff.widths = charStringsAndSeacs.widths;
    return cff;
  }
  parseHeader() {
    let bytes = this.bytes;
    const bytesLength = bytes.length;
    let offset = 0;
    while (offset < bytesLength && bytes[offset] !== 1) {
      ++offset;
    }
    if (offset >= bytesLength) {
      throw new FormatError("Invalid CFF header");
    }
    if (offset !== 0) {
      info("cff data is shifted");
      bytes = bytes.subarray(offset);
      this.bytes = bytes;
    }
    const major = bytes[0];
    const minor = bytes[1];
    const hdrSize = bytes[2];
    const offSize = bytes[3];
    const header = new CFFHeader(major, minor, hdrSize, offSize);
    return {
      obj: header,
      endPos: hdrSize
    };
  }
  parseDict(dict) {
    let pos = 0;
    function parseOperand() {
      let value = dict[pos++];
      if (value === 30) {
        return parseFloatOperand();
      } else if (value === 28) {
        value = readInt16(dict, pos);
        pos += 2;
        return value;
      } else if (value === 29) {
        value = dict[pos++];
        value = value << 8 | dict[pos++];
        value = value << 8 | dict[pos++];
        value = value << 8 | dict[pos++];
        return value;
      } else if (value >= 32 && value <= 246) {
        return value - 139;
      } else if (value >= 247 && value <= 250) {
        return (value - 247) * 256 + dict[pos++] + 108;
      } else if (value >= 251 && value <= 254) {
        return -((value - 251) * 256) - dict[pos++] - 108;
      }
      warn('CFFParser_parseDict: "' + value + '" is a reserved command.');
      return NaN;
    }
    function parseFloatOperand() {
      let str = "";
      const eof = 15;
      const lookup = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "E", "E-", null, "-"];
      const length = dict.length;
      while (pos < length) {
        const b = dict[pos++];
        const b1 = b >> 4;
        const b2 = b & 15;
        if (b1 === eof) {
          break;
        }
        str += lookup[b1];
        if (b2 === eof) {
          break;
        }
        str += lookup[b2];
      }
      return parseFloat(str);
    }
    let operands = [];
    const entries = [];
    pos = 0;
    const end = dict.length;
    while (pos < end) {
      let b = dict[pos];
      if (b <= 21) {
        if (b === 12) {
          b = b << 8 | dict[++pos];
        }
        entries.push([b, operands]);
        operands = [];
        ++pos;
      } else {
        operands.push(parseOperand());
      }
    }
    return entries;
  }
  parseIndex(pos) {
    const cffIndex = new CFFIndex();
    const bytes = this.bytes;
    const count = bytes[pos++] << 8 | bytes[pos++];
    const offsets = [];
    let end = pos;
    let i, ii;
    if (count !== 0) {
      const offsetSize = bytes[pos++];
      const startPos = pos + (count + 1) * offsetSize - 1;
      for (i = 0, ii = count + 1; i < ii; ++i) {
        let offset = 0;
        for (let j = 0; j < offsetSize; ++j) {
          offset <<= 8;
          offset += bytes[pos++];
        }
        offsets.push(startPos + offset);
      }
      end = offsets[count];
    }
    for (i = 0, ii = offsets.length - 1; i < ii; ++i) {
      const offsetStart = offsets[i];
      const offsetEnd = offsets[i + 1];
      cffIndex.add(bytes.subarray(offsetStart, offsetEnd));
    }
    return {
      obj: cffIndex,
      endPos: end
    };
  }
  parseNameIndex(index) {
    const names = [];
    for (let i = 0, ii = index.count; i < ii; ++i) {
      const name = index.get(i);
      names.push(bytesToString(name));
    }
    return names;
  }
  parseStringIndex(index) {
    const strings = new CFFStrings();
    for (let i = 0, ii = index.count; i < ii; ++i) {
      const data = index.get(i);
      strings.add(bytesToString(data));
    }
    return strings;
  }
  createDict(Type, dict, strings) {
    const cffDict = new Type(strings);
    for (const [key, value] of dict) {
      cffDict.setByKey(key, value);
    }
    return cffDict;
  }
  parseCharString(state, data, localSubrIndex, globalSubrIndex) {
    if (!data || state.callDepth > MAX_SUBR_NESTING) {
      return false;
    }
    let stackSize = state.stackSize;
    const stack = state.stack;
    let length = data.length;
    for (let j = 0; j < length;) {
      const value = data[j++];
      let validationCommand = null;
      if (value === 12) {
        const q = data[j++];
        if (q === 0) {
          data[j - 2] = 139;
          data[j - 1] = 22;
          stackSize = 0;
        } else {
          validationCommand = CharstringValidationData12[q];
        }
      } else if (value === 28) {
        stack[stackSize] = readInt16(data, j);
        j += 2;
        stackSize++;
      } else if (value === 14) {
        if (stackSize >= 4) {
          stackSize -= 4;
          if (this.seacAnalysisEnabled) {
            state.seac = stack.slice(stackSize, stackSize + 4);
            return false;
          }
        }
        validationCommand = CharstringValidationData[value];
      } else if (value >= 32 && value <= 246) {
        stack[stackSize] = value - 139;
        stackSize++;
      } else if (value >= 247 && value <= 254) {
        stack[stackSize] = value < 251 ? (value - 247 << 8) + data[j] + 108 : -(value - 251 << 8) - data[j] - 108;
        j++;
        stackSize++;
      } else if (value === 255) {
        stack[stackSize] = (data[j] << 24 | data[j + 1] << 16 | data[j + 2] << 8 | data[j + 3]) / 65536;
        j += 4;
        stackSize++;
      } else if (value === 19 || value === 20) {
        state.hints += stackSize >> 1;
        if (state.hints === 0) {
          data.copyWithin(j - 1, j, -1);
          j -= 1;
          length -= 1;
          continue;
        }
        j += state.hints + 7 >> 3;
        stackSize %= 2;
        validationCommand = CharstringValidationData[value];
      } else if (value === 10 || value === 29) {
        const subrsIndex = value === 10 ? localSubrIndex : globalSubrIndex;
        if (!subrsIndex) {
          validationCommand = CharstringValidationData[value];
          warn("Missing subrsIndex for " + validationCommand.id);
          return false;
        }
        let bias = 32768;
        if (subrsIndex.count < 1240) {
          bias = 107;
        } else if (subrsIndex.count < 33900) {
          bias = 1131;
        }
        const subrNumber = stack[--stackSize] + bias;
        if (subrNumber < 0 || subrNumber >= subrsIndex.count || isNaN(subrNumber)) {
          validationCommand = CharstringValidationData[value];
          warn("Out of bounds subrIndex for " + validationCommand.id);
          return false;
        }
        state.stackSize = stackSize;
        state.callDepth++;
        const valid = this.parseCharString(state, subrsIndex.get(subrNumber), localSubrIndex, globalSubrIndex);
        if (!valid) {
          return false;
        }
        state.callDepth--;
        stackSize = state.stackSize;
        continue;
      } else if (value === 11) {
        state.stackSize = stackSize;
        return true;
      } else if (value === 0 && j === data.length) {
        data[j - 1] = 14;
        validationCommand = CharstringValidationData[14];
      } else if (value === 9) {
        data.copyWithin(j - 1, j, -1);
        j -= 1;
        length -= 1;
        continue;
      } else {
        validationCommand = CharstringValidationData[value];
      }
      if (validationCommand) {
        if (validationCommand.stem) {
          state.hints += stackSize >> 1;
          if (value === 3 || value === 23) {
            state.hasVStems = true;
          } else if (state.hasVStems && (value === 1 || value === 18)) {
            warn("CFF stem hints are in wrong order");
            data[j - 1] = value === 1 ? 3 : 23;
          }
        }
        if ("min" in validationCommand) {
          if (!state.undefStack && stackSize < validationCommand.min) {
            warn("Not enough parameters for " + validationCommand.id + "; actual: " + stackSize + ", expected: " + validationCommand.min);
            if (stackSize === 0) {
              data[j - 1] = 14;
              return true;
            }
            return false;
          }
        }
        if (state.firstStackClearing && validationCommand.stackClearing) {
          state.firstStackClearing = false;
          stackSize -= validationCommand.min;
          if (stackSize >= 2 && validationCommand.stem) {
            stackSize %= 2;
          } else if (stackSize > 1) {
            warn("Found too many parameters for stack-clearing command");
          }
          if (stackSize > 0) {
            state.width = stack[stackSize - 1];
          }
        }
        if ("stackDelta" in validationCommand) {
          if ("stackFn" in validationCommand) {
            validationCommand.stackFn(stack, stackSize);
          }
          stackSize += validationCommand.stackDelta;
        } else if (validationCommand.stackClearing) {
          stackSize = 0;
        } else if (validationCommand.resetStack) {
          stackSize = 0;
          state.undefStack = false;
        } else if (validationCommand.undefStack) {
          stackSize = 0;
          state.undefStack = true;
          state.firstStackClearing = false;
        }
      }
    }
    if (length < data.length) {
      data.fill(14, length);
    }
    state.stackSize = stackSize;
    return true;
  }
  parseCharStrings({
    charStrings,
    localSubrIndex,
    globalSubrIndex,
    fdSelect,
    fdArray,
    privateDict
  }) {
    const seacs = [];
    const widths = [];
    const count = charStrings.count;
    for (let i = 0; i < count; i++) {
      const charstring = charStrings.get(i);
      const state = {
        callDepth: 0,
        stackSize: 0,
        stack: [],
        undefStack: true,
        hints: 0,
        firstStackClearing: true,
        seac: null,
        width: null,
        hasVStems: false
      };
      let valid = true;
      let localSubrToUse = null;
      let privateDictToUse = privateDict;
      if (fdSelect && fdArray.length) {
        const fdIndex = fdSelect.getFDIndex(i);
        if (fdIndex === -1) {
          warn("Glyph index is not in fd select.");
          valid = false;
        }
        if (fdIndex >= fdArray.length) {
          warn("Invalid fd index for glyph index.");
          valid = false;
        }
        if (valid) {
          privateDictToUse = fdArray[fdIndex].privateDict;
          localSubrToUse = privateDictToUse.subrsIndex;
        }
      } else if (localSubrIndex) {
        localSubrToUse = localSubrIndex;
      }
      if (valid) {
        valid = this.parseCharString(state, charstring, localSubrToUse, globalSubrIndex);
      }
      if (state.width !== null) {
        const nominalWidth = privateDictToUse.getByName("nominalWidthX");
        widths[i] = nominalWidth + state.width;
      } else {
        const defaultWidth = privateDictToUse.getByName("defaultWidthX");
        widths[i] = defaultWidth;
      }
      if (state.seac !== null) {
        seacs[i] = state.seac;
      }
      if (!valid) {
        charStrings.set(i, new Uint8Array([14]));
      }
    }
    return {
      charStrings,
      seacs,
      widths
    };
  }
  emptyPrivateDictionary(parentDict) {
    const privateDict = this.createDict(CFFPrivateDict, [], parentDict.strings);
    parentDict.setByKey(18, [0, 0]);
    parentDict.privateDict = privateDict;
  }
  parsePrivateDict(parentDict) {
    if (!parentDict.hasName("Private")) {
      this.emptyPrivateDictionary(parentDict);
      return;
    }
    const privateOffset = parentDict.getByName("Private");
    if (!Array.isArray(privateOffset) || privateOffset.length !== 2) {
      parentDict.removeByName("Private");
      return;
    }
    const size = privateOffset[0];
    const offset = privateOffset[1];
    if (size === 0 || offset >= this.bytes.length) {
      this.emptyPrivateDictionary(parentDict);
      return;
    }
    const privateDictEnd = offset + size;
    const dictData = this.bytes.subarray(offset, privateDictEnd);
    const dict = this.parseDict(dictData);
    const privateDict = this.createDict(CFFPrivateDict, dict, parentDict.strings);
    parentDict.privateDict = privateDict;
    if (privateDict.getByName("ExpansionFactor") === 0) {
      privateDict.setByName("ExpansionFactor", 0.06);
    }
    if (!privateDict.getByName("Subrs")) {
      return;
    }
    const subrsOffset = privateDict.getByName("Subrs");
    const relativeOffset = offset + subrsOffset;
    if (subrsOffset === 0 || relativeOffset >= this.bytes.length) {
      this.emptyPrivateDictionary(parentDict);
      return;
    }
    const subrsIndex = this.parseIndex(relativeOffset);
    privateDict.subrsIndex = subrsIndex.obj;
  }
  parseCharsets(pos, length, strings, cid) {
    if (pos === 0) {
      return new CFFCharset(true, CFFCharsetPredefinedTypes.ISO_ADOBE, ISOAdobeCharset);
    } else if (pos === 1) {
      return new CFFCharset(true, CFFCharsetPredefinedTypes.EXPERT, ExpertCharset);
    } else if (pos === 2) {
      return new CFFCharset(true, CFFCharsetPredefinedTypes.EXPERT_SUBSET, ExpertSubsetCharset);
    }
    const bytes = this.bytes;
    const start = pos;
    const format = bytes[pos++];
    const charset = [cid ? 0 : ".notdef"];
    let id, count, i;
    length -= 1;
    switch (format) {
      case 0:
        for (i = 0; i < length; i++) {
          id = bytes[pos++] << 8 | bytes[pos++];
          charset.push(cid ? id : strings.get(id));
        }
        break;
      case 1:
        while (charset.length <= length) {
          id = bytes[pos++] << 8 | bytes[pos++];
          count = bytes[pos++];
          for (i = 0; i <= count; i++) {
            charset.push(cid ? id++ : strings.get(id++));
          }
        }
        break;
      case 2:
        while (charset.length <= length) {
          id = bytes[pos++] << 8 | bytes[pos++];
          count = bytes[pos++] << 8 | bytes[pos++];
          for (i = 0; i <= count; i++) {
            charset.push(cid ? id++ : strings.get(id++));
          }
        }
        break;
      default:
        throw new FormatError("Unknown charset format");
    }
    const end = pos;
    const raw = bytes.subarray(start, end);
    return new CFFCharset(false, format, charset, raw);
  }
  parseEncoding(pos, properties, strings, charset) {
    const encoding = Object.create(null);
    const bytes = this.bytes;
    let predefined = false;
    let format, i, ii;
    let raw = null;
    function readSupplement() {
      const supplementsCount = bytes[pos++];
      for (i = 0; i < supplementsCount; i++) {
        const code = bytes[pos++];
        const sid = (bytes[pos++] << 8) + (bytes[pos++] & 0xff);
        encoding[code] = charset.indexOf(strings.get(sid));
      }
    }
    if (pos === 0 || pos === 1) {
      predefined = true;
      format = pos;
      const baseEncoding = pos ? ExpertEncoding : StandardEncoding;
      for (i = 0, ii = charset.length; i < ii; i++) {
        const index = baseEncoding.indexOf(charset[i]);
        if (index !== -1) {
          encoding[index] = i;
        }
      }
    } else {
      const dataStart = pos;
      format = bytes[pos++];
      switch (format & 0x7f) {
        case 0:
          const glyphsCount = bytes[pos++];
          for (i = 1; i <= glyphsCount; i++) {
            encoding[bytes[pos++]] = i;
          }
          break;
        case 1:
          const rangesCount = bytes[pos++];
          let gid = 1;
          for (i = 0; i < rangesCount; i++) {
            const start = bytes[pos++];
            const left = bytes[pos++];
            for (let j = start; j <= start + left; j++) {
              encoding[j] = gid++;
            }
          }
          break;
        default:
          throw new FormatError(`Unknown encoding format: ${format} in CFF`);
      }
      const dataEnd = pos;
      if (format & 0x80) {
        bytes[dataStart] &= 0x7f;
        readSupplement();
      }
      raw = bytes.subarray(dataStart, dataEnd);
    }
    format &= 0x7f;
    return new CFFEncoding(predefined, format, encoding, raw);
  }
  parseFDSelect(pos, length) {
    const bytes = this.bytes;
    const format = bytes[pos++];
    const fdSelect = [];
    let i;
    switch (format) {
      case 0:
        for (i = 0; i < length; ++i) {
          const id = bytes[pos++];
          fdSelect.push(id);
        }
        break;
      case 3:
        const rangesCount = bytes[pos++] << 8 | bytes[pos++];
        for (i = 0; i < rangesCount; ++i) {
          let first = bytes[pos++] << 8 | bytes[pos++];
          if (i === 0 && first !== 0) {
            warn("parseFDSelect: The first range must have a first GID of 0" + " -- trying to recover.");
            first = 0;
          }
          const fdIndex = bytes[pos++];
          const next = bytes[pos] << 8 | bytes[pos + 1];
          for (let j = first; j < next; ++j) {
            fdSelect.push(fdIndex);
          }
        }
        pos += 2;
        break;
      default:
        throw new FormatError(`parseFDSelect: Unknown format "${format}".`);
    }
    if (fdSelect.length !== length) {
      throw new FormatError("parseFDSelect: Invalid font data.");
    }
    return new CFFFDSelect(format, fdSelect);
  }
}
class CFF {
  constructor() {
    this.header = null;
    this.names = [];
    this.topDict = null;
    this.strings = new CFFStrings();
    this.globalSubrIndex = null;
    this.encoding = null;
    this.charset = null;
    this.charStrings = null;
    this.fdArray = [];
    this.fdSelect = null;
    this.isCIDFont = false;
  }
  duplicateFirstGlyph() {
    if (this.charStrings.count >= 65535) {
      warn("Not enough space in charstrings to duplicate first glyph.");
      return;
    }
    const glyphZero = this.charStrings.get(0);
    this.charStrings.add(glyphZero);
    if (this.isCIDFont) {
      this.fdSelect.fdSelect.push(this.fdSelect.fdSelect[0]);
    }
  }
  hasGlyphId(id) {
    if (id < 0 || id >= this.charStrings.count) {
      return false;
    }
    const glyph = this.charStrings.get(id);
    return glyph.length > 0;
  }
}
class CFFHeader {
  constructor(major, minor, hdrSize, offSize) {
    this.major = major;
    this.minor = minor;
    this.hdrSize = hdrSize;
    this.offSize = offSize;
  }
}
class CFFStrings {
  constructor() {
    this.strings = [];
  }
  get(index) {
    if (index >= 0 && index <= NUM_STANDARD_CFF_STRINGS - 1) {
      return CFFStandardStrings[index];
    }
    if (index - NUM_STANDARD_CFF_STRINGS <= this.strings.length) {
      return this.strings[index - NUM_STANDARD_CFF_STRINGS];
    }
    return CFFStandardStrings[0];
  }
  getSID(str) {
    let index = CFFStandardStrings.indexOf(str);
    if (index !== -1) {
      return index;
    }
    index = this.strings.indexOf(str);
    if (index !== -1) {
      return index + NUM_STANDARD_CFF_STRINGS;
    }
    return -1;
  }
  add(value) {
    this.strings.push(value);
  }
  get count() {
    return this.strings.length;
  }
}
class CFFIndex {
  constructor() {
    this.objects = [];
    this.length = 0;
  }
  add(data) {
    this.length += data.length;
    this.objects.push(data);
  }
  set(index, data) {
    this.length += data.length - this.objects[index].length;
    this.objects[index] = data;
  }
  get(index) {
    return this.objects[index];
  }
  get count() {
    return this.objects.length;
  }
}
class CFFDict {
  constructor(tables, strings) {
    this.keyToNameMap = tables.keyToNameMap;
    this.nameToKeyMap = tables.nameToKeyMap;
    this.defaults = tables.defaults;
    this.types = tables.types;
    this.opcodes = tables.opcodes;
    this.order = tables.order;
    this.strings = strings;
    this.values = Object.create(null);
  }
  setByKey(key, value) {
    if (!(key in this.keyToNameMap)) {
      return false;
    }
    if (value.length === 0) {
      return true;
    }
    for (const val of value) {
      if (isNaN(val)) {
        warn(`Invalid CFFDict value: "${value}" for key "${key}".`);
        return true;
      }
    }
    const type = this.types[key];
    if (type === "num" || type === "sid" || type === "offset") {
      value = value[0];
    }
    this.values[key] = value;
    return true;
  }
  setByName(name, value) {
    if (!(name in this.nameToKeyMap)) {
      throw new FormatError(`Invalid dictionary name "${name}"`);
    }
    this.values[this.nameToKeyMap[name]] = value;
  }
  hasName(name) {
    return this.nameToKeyMap[name] in this.values;
  }
  getByName(name) {
    if (!(name in this.nameToKeyMap)) {
      throw new FormatError(`Invalid dictionary name ${name}"`);
    }
    const key = this.nameToKeyMap[name];
    if (!(key in this.values)) {
      return this.defaults[key];
    }
    return this.values[key];
  }
  removeByName(name) {
    delete this.values[this.nameToKeyMap[name]];
  }
  static createTables(layout) {
    const tables = {
      keyToNameMap: {},
      nameToKeyMap: {},
      defaults: {},
      types: {},
      opcodes: {},
      order: []
    };
    for (const entry of layout) {
      const key = Array.isArray(entry[0]) ? (entry[0][0] << 8) + entry[0][1] : entry[0];
      tables.keyToNameMap[key] = entry[1];
      tables.nameToKeyMap[entry[1]] = key;
      tables.types[key] = entry[2];
      tables.defaults[key] = entry[3];
      tables.opcodes[key] = Array.isArray(entry[0]) ? entry[0] : [entry[0]];
      tables.order.push(key);
    }
    return tables;
  }
}
const CFFTopDictLayout = [[[12, 30], "ROS", ["sid", "sid", "num"], null], [[12, 20], "SyntheticBase", "num", null], [0, "version", "sid", null], [1, "Notice", "sid", null], [[12, 0], "Copyright", "sid", null], [2, "FullName", "sid", null], [3, "FamilyName", "sid", null], [4, "Weight", "sid", null], [[12, 1], "isFixedPitch", "num", 0], [[12, 2], "ItalicAngle", "num", 0], [[12, 3], "UnderlinePosition", "num", -100], [[12, 4], "UnderlineThickness", "num", 50], [[12, 5], "PaintType", "num", 0], [[12, 6], "CharstringType", "num", 2], [[12, 7], "FontMatrix", ["num", "num", "num", "num", "num", "num"], [0.001, 0, 0, 0.001, 0, 0]], [13, "UniqueID", "num", null], [5, "FontBBox", ["num", "num", "num", "num"], [0, 0, 0, 0]], [[12, 8], "StrokeWidth", "num", 0], [14, "XUID", "array", null], [15, "charset", "offset", 0], [16, "Encoding", "offset", 0], [17, "CharStrings", "offset", 0], [18, "Private", ["offset", "offset"], null], [[12, 21], "PostScript", "sid", null], [[12, 22], "BaseFontName", "sid", null], [[12, 23], "BaseFontBlend", "delta", null], [[12, 31], "CIDFontVersion", "num", 0], [[12, 32], "CIDFontRevision", "num", 0], [[12, 33], "CIDFontType", "num", 0], [[12, 34], "CIDCount", "num", 8720], [[12, 35], "UIDBase", "num", null], [[12, 37], "FDSelect", "offset", null], [[12, 36], "FDArray", "offset", null], [[12, 38], "FontName", "sid", null]];
class CFFTopDict extends CFFDict {
  static get tables() {
    return shadow(this, "tables", this.createTables(CFFTopDictLayout));
  }
  constructor(strings) {
    super(CFFTopDict.tables, strings);
    this.privateDict = null;
  }
}
const CFFPrivateDictLayout = [[6, "BlueValues", "delta", null], [7, "OtherBlues", "delta", null], [8, "FamilyBlues", "delta", null], [9, "FamilyOtherBlues", "delta", null], [[12, 9], "BlueScale", "num", 0.039625], [[12, 10], "BlueShift", "num", 7], [[12, 11], "BlueFuzz", "num", 1], [10, "StdHW", "num", null], [11, "StdVW", "num", null], [[12, 12], "StemSnapH", "delta", null], [[12, 13], "StemSnapV", "delta", null], [[12, 14], "ForceBold", "num", 0], [[12, 17], "LanguageGroup", "num", 0], [[12, 18], "ExpansionFactor", "num", 0.06], [[12, 19], "initialRandomSeed", "num", 0], [20, "defaultWidthX", "num", 0], [21, "nominalWidthX", "num", 0], [19, "Subrs", "offset", null]];
class CFFPrivateDict extends CFFDict {
  static get tables() {
    return shadow(this, "tables", this.createTables(CFFPrivateDictLayout));
  }
  constructor(strings) {
    super(CFFPrivateDict.tables, strings);
    this.subrsIndex = null;
  }
}
const CFFCharsetPredefinedTypes = {
  ISO_ADOBE: 0,
  EXPERT: 1,
  EXPERT_SUBSET: 2
};
class CFFCharset {
  constructor(predefined, format, charset, raw) {
    this.predefined = predefined;
    this.format = format;
    this.charset = charset;
    this.raw = raw;
  }
}
class CFFEncoding {
  constructor(predefined, format, encoding, raw) {
    this.predefined = predefined;
    this.format = format;
    this.encoding = encoding;
    this.raw = raw;
  }
}
class CFFFDSelect {
  constructor(format, fdSelect) {
    this.format = format;
    this.fdSelect = fdSelect;
  }
  getFDIndex(glyphIndex) {
    if (glyphIndex < 0 || glyphIndex >= this.fdSelect.length) {
      return -1;
    }
    return this.fdSelect[glyphIndex];
  }
}
class CFFOffsetTracker {
  constructor() {
    this.offsets = Object.create(null);
  }
  isTracking(key) {
    return key in this.offsets;
  }
  track(key, location) {
    if (key in this.offsets) {
      throw new FormatError(`Already tracking location of ${key}`);
    }
    this.offsets[key] = location;
  }
  offset(value) {
    for (const key in this.offsets) {
      this.offsets[key] += value;
    }
  }
  setEntryLocation(key, values, output) {
    if (!(key in this.offsets)) {
      throw new FormatError(`Not tracking location of ${key}`);
    }
    const data = output.data;
    const dataOffset = this.offsets[key];
    const size = 5;
    for (let i = 0, ii = values.length; i < ii; ++i) {
      const offset0 = i * size + dataOffset;
      const offset1 = offset0 + 1;
      const offset2 = offset0 + 2;
      const offset3 = offset0 + 3;
      const offset4 = offset0 + 4;
      if (data[offset0] !== 0x1d || data[offset1] !== 0 || data[offset2] !== 0 || data[offset3] !== 0 || data[offset4] !== 0) {
        throw new FormatError("writing to an offset that is not empty");
      }
      const value = values[i];
      data[offset0] = 0x1d;
      data[offset1] = value >> 24 & 0xff;
      data[offset2] = value >> 16 & 0xff;
      data[offset3] = value >> 8 & 0xff;
      data[offset4] = value & 0xff;
    }
  }
}
class CFFCompiler {
  constructor(cff) {
    this.cff = cff;
  }
  compile() {
    const cff = this.cff;
    const output = {
      data: [],
      length: 0,
      add(data) {
        try {
          this.data.push(...data);
        } catch {
          this.data = this.data.concat(data);
        }
        this.length = this.data.length;
      }
    };
    const header = this.compileHeader(cff.header);
    output.add(header);
    const nameIndex = this.compileNameIndex(cff.names);
    output.add(nameIndex);
    if (cff.isCIDFont) {
      if (cff.topDict.hasName("FontMatrix")) {
        const base = cff.topDict.getByName("FontMatrix");
        cff.topDict.removeByName("FontMatrix");
        for (const subDict of cff.fdArray) {
          let matrix = base.slice(0);
          if (subDict.hasName("FontMatrix")) {
            matrix = Util.transform(matrix, subDict.getByName("FontMatrix"));
          }
          subDict.setByName("FontMatrix", matrix);
        }
      }
    }
    const xuid = cff.topDict.getByName("XUID");
    if (xuid?.length > 16) {
      cff.topDict.removeByName("XUID");
    }
    cff.topDict.setByName("charset", 0);
    let compiled = this.compileTopDicts([cff.topDict], output.length, cff.isCIDFont);
    output.add(compiled.output);
    const topDictTracker = compiled.trackers[0];
    const stringIndex = this.compileStringIndex(cff.strings.strings);
    output.add(stringIndex);
    const globalSubrIndex = this.compileIndex(cff.globalSubrIndex);
    output.add(globalSubrIndex);
    if (cff.encoding && cff.topDict.hasName("Encoding")) {
      if (cff.encoding.predefined) {
        topDictTracker.setEntryLocation("Encoding", [cff.encoding.format], output);
      } else {
        const encoding = this.compileEncoding(cff.encoding);
        topDictTracker.setEntryLocation("Encoding", [output.length], output);
        output.add(encoding);
      }
    }
    const charset = this.compileCharset(cff.charset, cff.charStrings.count, cff.strings, cff.isCIDFont);
    topDictTracker.setEntryLocation("charset", [output.length], output);
    output.add(charset);
    const charStrings = this.compileCharStrings(cff.charStrings);
    topDictTracker.setEntryLocation("CharStrings", [output.length], output);
    output.add(charStrings);
    if (cff.isCIDFont) {
      topDictTracker.setEntryLocation("FDSelect", [output.length], output);
      const fdSelect = this.compileFDSelect(cff.fdSelect);
      output.add(fdSelect);
      compiled = this.compileTopDicts(cff.fdArray, output.length, true);
      topDictTracker.setEntryLocation("FDArray", [output.length], output);
      output.add(compiled.output);
      const fontDictTrackers = compiled.trackers;
      this.compilePrivateDicts(cff.fdArray, fontDictTrackers, output);
    }
    this.compilePrivateDicts([cff.topDict], [topDictTracker], output);
    output.add([0]);
    return output.data;
  }
  encodeNumber(value) {
    if (Number.isInteger(value)) {
      return this.encodeInteger(value);
    }
    return this.encodeFloat(value);
  }
  static get EncodeFloatRegExp() {
    return shadow(this, "EncodeFloatRegExp", /\.(\d*?)(?:9{5,20}|0{5,20})\d{0,2}(?:e(.+)|$)/);
  }
  encodeFloat(num) {
    let value = num.toString();
    const m = CFFCompiler.EncodeFloatRegExp.exec(value);
    if (m) {
      const epsilon = parseFloat("1e" + ((m[2] ? +m[2] : 0) + m[1].length));
      value = (Math.round(num * epsilon) / epsilon).toString();
    }
    let nibbles = "";
    let i, ii;
    for (i = 0, ii = value.length; i < ii; ++i) {
      const a = value[i];
      if (a === "e") {
        nibbles += value[++i] === "-" ? "c" : "b";
      } else if (a === ".") {
        nibbles += "a";
      } else if (a === "-") {
        nibbles += "e";
      } else {
        nibbles += a;
      }
    }
    nibbles += nibbles.length & 1 ? "f" : "ff";
    const out = [30];
    for (i = 0, ii = nibbles.length; i < ii; i += 2) {
      out.push(parseInt(nibbles.substring(i, i + 2), 16));
    }
    return out;
  }
  encodeInteger(value) {
    let code;
    if (value >= -107 && value <= 107) {
      code = [value + 139];
    } else if (value >= 108 && value <= 1131) {
      value -= 108;
      code = [(value >> 8) + 247, value & 0xff];
    } else if (value >= -1131 && value <= -108) {
      value = -value - 108;
      code = [(value >> 8) + 251, value & 0xff];
    } else if (value >= -32768 && value <= 32767) {
      code = [0x1c, value >> 8 & 0xff, value & 0xff];
    } else {
      code = [0x1d, value >> 24 & 0xff, value >> 16 & 0xff, value >> 8 & 0xff, value & 0xff];
    }
    return code;
  }
  compileHeader(header) {
    return [header.major, header.minor, 4, header.offSize];
  }
  compileNameIndex(names) {
    const nameIndex = new CFFIndex();
    for (const name of names) {
      const length = Math.min(name.length, 127);
      let sanitizedName = new Array(length);
      for (let j = 0; j < length; j++) {
        let char = name[j];
        if (char < "!" || char > "~" || char === "[" || char === "]" || char === "(" || char === ")" || char === "{" || char === "}" || char === "<" || char === ">" || char === "/" || char === "%") {
          char = "_";
        }
        sanitizedName[j] = char;
      }
      sanitizedName = sanitizedName.join("");
      if (sanitizedName === "") {
        sanitizedName = "Bad_Font_Name";
      }
      nameIndex.add(stringToBytes(sanitizedName));
    }
    return this.compileIndex(nameIndex);
  }
  compileTopDicts(dicts, length, removeCidKeys) {
    const fontDictTrackers = [];
    let fdArrayIndex = new CFFIndex();
    for (const fontDict of dicts) {
      if (removeCidKeys) {
        fontDict.removeByName("CIDFontVersion");
        fontDict.removeByName("CIDFontRevision");
        fontDict.removeByName("CIDFontType");
        fontDict.removeByName("CIDCount");
        fontDict.removeByName("UIDBase");
      }
      const fontDictTracker = new CFFOffsetTracker();
      const fontDictData = this.compileDict(fontDict, fontDictTracker);
      fontDictTrackers.push(fontDictTracker);
      fdArrayIndex.add(fontDictData);
      fontDictTracker.offset(length);
    }
    fdArrayIndex = this.compileIndex(fdArrayIndex, fontDictTrackers);
    return {
      trackers: fontDictTrackers,
      output: fdArrayIndex
    };
  }
  compilePrivateDicts(dicts, trackers, output) {
    for (let i = 0, ii = dicts.length; i < ii; ++i) {
      const fontDict = dicts[i];
      const privateDict = fontDict.privateDict;
      if (!privateDict || !fontDict.hasName("Private")) {
        throw new FormatError("There must be a private dictionary.");
      }
      const privateDictTracker = new CFFOffsetTracker();
      const privateDictData = this.compileDict(privateDict, privateDictTracker);
      let outputLength = output.length;
      privateDictTracker.offset(outputLength);
      if (!privateDictData.length) {
        outputLength = 0;
      }
      trackers[i].setEntryLocation("Private", [privateDictData.length, outputLength], output);
      output.add(privateDictData);
      if (privateDict.subrsIndex && privateDict.hasName("Subrs")) {
        const subrs = this.compileIndex(privateDict.subrsIndex);
        privateDictTracker.setEntryLocation("Subrs", [privateDictData.length], output);
        output.add(subrs);
      }
    }
  }
  compileDict(dict, offsetTracker) {
    const out = [];
    for (const key of dict.order) {
      if (!(key in dict.values)) {
        continue;
      }
      let values = dict.values[key];
      let types = dict.types[key];
      if (!Array.isArray(types)) {
        types = [types];
      }
      if (!Array.isArray(values)) {
        values = [values];
      }
      if (values.length === 0) {
        continue;
      }
      for (let j = 0, jj = types.length; j < jj; ++j) {
        const type = types[j];
        const value = values[j];
        switch (type) {
          case "num":
          case "sid":
            out.push(...this.encodeNumber(value));
            break;
          case "offset":
            const name = dict.keyToNameMap[key];
            if (!offsetTracker.isTracking(name)) {
              offsetTracker.track(name, out.length);
            }
            out.push(0x1d, 0, 0, 0, 0);
            break;
          case "array":
          case "delta":
            out.push(...this.encodeNumber(value));
            for (let k = 1, kk = values.length; k < kk; ++k) {
              out.push(...this.encodeNumber(values[k]));
            }
            break;
          default:
            throw new FormatError(`Unknown data type of ${type}`);
        }
      }
      out.push(...dict.opcodes[key]);
    }
    return out;
  }
  compileStringIndex(strings) {
    const stringIndex = new CFFIndex();
    for (const string of strings) {
      stringIndex.add(stringToBytes(string));
    }
    return this.compileIndex(stringIndex);
  }
  compileCharStrings(charStrings) {
    const charStringsIndex = new CFFIndex();
    for (let i = 0; i < charStrings.count; i++) {
      const glyph = charStrings.get(i);
      if (glyph.length === 0) {
        charStringsIndex.add(new Uint8Array([0x8b, 0x0e]));
        continue;
      }
      charStringsIndex.add(glyph);
    }
    return this.compileIndex(charStringsIndex);
  }
  compileCharset(charset, numGlyphs, strings, isCIDFont) {
    let out;
    const numGlyphsLessNotDef = numGlyphs - 1;
    if (isCIDFont) {
      const nLeft = numGlyphsLessNotDef - 1;
      out = new Uint8Array([2, 0, 0, nLeft >> 8 & 0xff, nLeft & 0xff]);
    } else {
      const length = 1 + numGlyphsLessNotDef * 2;
      out = new Uint8Array(length);
      out[0] = 0;
      let charsetIndex = 0;
      const numCharsets = charset.charset.length;
      let warned = false;
      for (let i = 1; i < out.length; i += 2) {
        let sid = 0;
        if (charsetIndex < numCharsets) {
          const name = charset.charset[charsetIndex++];
          sid = strings.getSID(name);
          if (sid === -1) {
            sid = 0;
            if (!warned) {
              warned = true;
              warn(`Couldn't find ${name} in CFF strings`);
            }
          }
        }
        out[i] = sid >> 8 & 0xff;
        out[i + 1] = sid & 0xff;
      }
    }
    return this.compileTypedArray(out);
  }
  compileEncoding(encoding) {
    return this.compileTypedArray(encoding.raw);
  }
  compileFDSelect(fdSelect) {
    const format = fdSelect.format;
    let out, i;
    switch (format) {
      case 0:
        out = new Uint8Array(1 + fdSelect.fdSelect.length);
        out[0] = format;
        for (i = 0; i < fdSelect.fdSelect.length; i++) {
          out[i + 1] = fdSelect.fdSelect[i];
        }
        break;
      case 3:
        const start = 0;
        let lastFD = fdSelect.fdSelect[0];
        const ranges = [format, 0, 0, start >> 8 & 0xff, start & 0xff, lastFD];
        for (i = 1; i < fdSelect.fdSelect.length; i++) {
          const currentFD = fdSelect.fdSelect[i];
          if (currentFD !== lastFD) {
            ranges.push(i >> 8 & 0xff, i & 0xff, currentFD);
            lastFD = currentFD;
          }
        }
        const numRanges = (ranges.length - 3) / 3;
        ranges[1] = numRanges >> 8 & 0xff;
        ranges[2] = numRanges & 0xff;
        ranges.push(i >> 8 & 0xff, i & 0xff);
        out = new Uint8Array(ranges);
        break;
    }
    return this.compileTypedArray(out);
  }
  compileTypedArray(data) {
    return Array.from(data);
  }
  compileIndex(index, trackers = []) {
    const objects = index.objects;
    const count = objects.length;
    if (count === 0) {
      return [0, 0];
    }
    const data = [count >> 8 & 0xff, count & 0xff];
    let lastOffset = 1,
      i;
    for (i = 0; i < count; ++i) {
      lastOffset += objects[i].length;
    }
    let offsetSize;
    if (lastOffset < 0x100) {
      offsetSize = 1;
    } else if (lastOffset < 0x10000) {
      offsetSize = 2;
    } else if (lastOffset < 0x1000000) {
      offsetSize = 3;
    } else {
      offsetSize = 4;
    }
    data.push(offsetSize);
    let relativeOffset = 1;
    for (i = 0; i < count + 1; i++) {
      if (offsetSize === 1) {
        data.push(relativeOffset & 0xff);
      } else if (offsetSize === 2) {
        data.push(relativeOffset >> 8 & 0xff, relativeOffset & 0xff);
      } else if (offsetSize === 3) {
        data.push(relativeOffset >> 16 & 0xff, relativeOffset >> 8 & 0xff, relativeOffset & 0xff);
      } else {
        data.push(relativeOffset >>> 24 & 0xff, relativeOffset >> 16 & 0xff, relativeOffset >> 8 & 0xff, relativeOffset & 0xff);
      }
      if (objects[i]) {
        relativeOffset += objects[i].length;
      }
    }
    for (i = 0; i < count; i++) {
      if (trackers[i]) {
        trackers[i].offset(data.length);
      }
      data.push(...objects[i]);
    }
    return data;
  }
}

;// ./src/core/standard_fonts.js


const getStdFontMap = getLookupTableFactory(function (t) {
  t["Times-Roman"] = "Times-Roman";
  t.Helvetica = "Helvetica";
  t.Courier = "Courier";
  t.Symbol = "Symbol";
  t["Times-Bold"] = "Times-Bold";
  t["Helvetica-Bold"] = "Helvetica-Bold";
  t["Courier-Bold"] = "Courier-Bold";
  t.ZapfDingbats = "ZapfDingbats";
  t["Times-Italic"] = "Times-Italic";
  t["Helvetica-Oblique"] = "Helvetica-Oblique";
  t["Courier-Oblique"] = "Courier-Oblique";
  t["Times-BoldItalic"] = "Times-BoldItalic";
  t["Helvetica-BoldOblique"] = "Helvetica-BoldOblique";
  t["Courier-BoldOblique"] = "Courier-BoldOblique";
  t.ArialNarrow = "Helvetica";
  t["ArialNarrow-Bold"] = "Helvetica-Bold";
  t["ArialNarrow-BoldItalic"] = "Helvetica-BoldOblique";
  t["ArialNarrow-Italic"] = "Helvetica-Oblique";
  t.ArialBlack = "Helvetica";
  t["ArialBlack-Bold"] = "Helvetica-Bold";
  t["ArialBlack-BoldItalic"] = "Helvetica-BoldOblique";
  t["ArialBlack-Italic"] = "Helvetica-Oblique";
  t["Arial-Black"] = "Helvetica";
  t["Arial-Black-Bold"] = "Helvetica-Bold";
  t["Arial-Black-BoldItalic"] = "Helvetica-BoldOblique";
  t["Arial-Black-Italic"] = "Helvetica-Oblique";
  t.Arial = "Helvetica";
  t["Arial-Bold"] = "Helvetica-Bold";
  t["Arial-BoldItalic"] = "Helvetica-BoldOblique";
  t["Arial-Italic"] = "Helvetica-Oblique";
  t.ArialMT = "Helvetica";
  t["Arial-BoldItalicMT"] = "Helvetica-BoldOblique";
  t["Arial-BoldMT"] = "Helvetica-Bold";
  t["Arial-ItalicMT"] = "Helvetica-Oblique";
  t["Arial-BoldItalicMT-BoldItalic"] = "Helvetica-BoldOblique";
  t["Arial-BoldMT-Bold"] = "Helvetica-Bold";
  t["Arial-ItalicMT-Italic"] = "Helvetica-Oblique";
  t.ArialUnicodeMS = "Helvetica";
  t["ArialUnicodeMS-Bold"] = "Helvetica-Bold";
  t["ArialUnicodeMS-BoldItalic"] = "Helvetica-BoldOblique";
  t["ArialUnicodeMS-Italic"] = "Helvetica-Oblique";
  t["Courier-BoldItalic"] = "Courier-BoldOblique";
  t["Courier-Italic"] = "Courier-Oblique";
  t.CourierNew = "Courier";
  t["CourierNew-Bold"] = "Courier-Bold";
  t["CourierNew-BoldItalic"] = "Courier-BoldOblique";
  t["CourierNew-Italic"] = "Courier-Oblique";
  t["CourierNewPS-BoldItalicMT"] = "Courier-BoldOblique";
  t["CourierNewPS-BoldMT"] = "Courier-Bold";
  t["CourierNewPS-ItalicMT"] = "Courier-Oblique";
  t.CourierNewPSMT = "Courier";
  t["Helvetica-BoldItalic"] = "Helvetica-BoldOblique";
  t["Helvetica-Italic"] = "Helvetica-Oblique";
  t["HelveticaLTStd-Bold"] = "Helvetica-Bold";
  t["Symbol-Bold"] = "Symbol";
  t["Symbol-BoldItalic"] = "Symbol";
  t["Symbol-Italic"] = "Symbol";
  t.TimesNewRoman = "Times-Roman";
  t["TimesNewRoman-Bold"] = "Times-Bold";
  t["TimesNewRoman-BoldItalic"] = "Times-BoldItalic";
  t["TimesNewRoman-Italic"] = "Times-Italic";
  t.TimesNewRomanPS = "Times-Roman";
  t["TimesNewRomanPS-Bold"] = "Times-Bold";
  t["TimesNewRomanPS-BoldItalic"] = "Times-BoldItalic";
  t["TimesNewRomanPS-BoldItalicMT"] = "Times-BoldItalic";
  t["TimesNewRomanPS-BoldMT"] = "Times-Bold";
  t["TimesNewRomanPS-Italic"] = "Times-Italic";
  t["TimesNewRomanPS-ItalicMT"] = "Times-Italic";
  t.TimesNewRomanPSMT = "Times-Roman";
  t["TimesNewRomanPSMT-Bold"] = "Times-Bold";
  t["TimesNewRomanPSMT-BoldItalic"] = "Times-BoldItalic";
  t["TimesNewRomanPSMT-Italic"] = "Times-Italic";
});
const getFontNameToFileMap = getLookupTableFactory(function (t) {
  t.Courier = "FoxitFixed.pfb";
  t["Courier-Bold"] = "FoxitFixedBold.pfb";
  t["Courier-BoldOblique"] = "FoxitFixedBoldItalic.pfb";
  t["Courier-Oblique"] = "FoxitFixedItalic.pfb";
  t.Helvetica = "LiberationSans-Regular.ttf";
  t["Helvetica-Bold"] = "LiberationSans-Bold.ttf";
  t["Helvetica-BoldOblique"] = "LiberationSans-BoldItalic.ttf";
  t["Helvetica-Oblique"] = "LiberationSans-Italic.ttf";
  t["Times-Roman"] = "FoxitSerif.pfb";
  t["Times-Bold"] = "FoxitSerifBold.pfb";
  t["Times-BoldItalic"] = "FoxitSerifBoldItalic.pfb";
  t["Times-Italic"] = "FoxitSerifItalic.pfb";
  t.Symbol = "FoxitSymbol.pfb";
  t.ZapfDingbats = "FoxitDingbats.pfb";
  t["LiberationSans-Regular"] = "LiberationSans-Regular.ttf";
  t["LiberationSans-Bold"] = "LiberationSans-Bold.ttf";
  t["LiberationSans-Italic"] = "LiberationSans-Italic.ttf";
  t["LiberationSans-BoldItalic"] = "LiberationSans-BoldItalic.ttf";
});
const getNonStdFontMap = getLookupTableFactory(function (t) {
  t.Calibri = "Helvetica";
  t["Calibri-Bold"] = "Helvetica-Bold";
  t["Calibri-BoldItalic"] = "Helvetica-BoldOblique";
  t["Calibri-Italic"] = "Helvetica-Oblique";
  t.CenturyGothic = "Helvetica";
  t["CenturyGothic-Bold"] = "Helvetica-Bold";
  t["CenturyGothic-BoldItalic"] = "Helvetica-BoldOblique";
  t["CenturyGothic-Italic"] = "Helvetica-Oblique";
  t.ComicSansMS = "Comic Sans MS";
  t["ComicSansMS-Bold"] = "Comic Sans MS-Bold";
  t["ComicSansMS-BoldItalic"] = "Comic Sans MS-BoldItalic";
  t["ComicSansMS-Italic"] = "Comic Sans MS-Italic";
  t.GillSansMT = "Helvetica";
  t["GillSansMT-Bold"] = "Helvetica-Bold";
  t["GillSansMT-BoldItalic"] = "Helvetica-BoldOblique";
  t["GillSansMT-Italic"] = "Helvetica-Oblique";
  t.Impact = "Helvetica";
  t["ItcSymbol-Bold"] = "Helvetica-Bold";
  t["ItcSymbol-BoldItalic"] = "Helvetica-BoldOblique";
  t["ItcSymbol-Book"] = "Helvetica";
  t["ItcSymbol-BookItalic"] = "Helvetica-Oblique";
  t["ItcSymbol-Medium"] = "Helvetica";
  t["ItcSymbol-MediumItalic"] = "Helvetica-Oblique";
  t.LucidaConsole = "Courier";
  t["LucidaConsole-Bold"] = "Courier-Bold";
  t["LucidaConsole-BoldItalic"] = "Courier-BoldOblique";
  t["LucidaConsole-Italic"] = "Courier-Oblique";
  t["LucidaSans-Demi"] = "Helvetica-Bold";
  t["MS-Gothic"] = "MS Gothic";
  t["MS-Gothic-Bold"] = "MS Gothic-Bold";
  t["MS-Gothic-BoldItalic"] = "MS Gothic-BoldItalic";
  t["MS-Gothic-Italic"] = "MS Gothic-Italic";
  t["MS-Mincho"] = "MS Mincho";
  t["MS-Mincho-Bold"] = "MS Mincho-Bold";
  t["MS-Mincho-BoldItalic"] = "MS Mincho-BoldItalic";
  t["MS-Mincho-Italic"] = "MS Mincho-Italic";
  t["MS-PGothic"] = "MS PGothic";
  t["MS-PGothic-Bold"] = "MS PGothic-Bold";
  t["MS-PGothic-BoldItalic"] = "MS PGothic-BoldItalic";
  t["MS-PGothic-Italic"] = "MS PGothic-Italic";
  t["MS-PMincho"] = "MS PMincho";
  t["MS-PMincho-Bold"] = "MS PMincho-Bold";
  t["MS-PMincho-BoldItalic"] = "MS PMincho-BoldItalic";
  t["MS-PMincho-Italic"] = "MS PMincho-Italic";
  t.NuptialScript = "Times-Italic";
  t.SegoeUISymbol = "Helvetica";
});
const getSerifFonts = getLookupTableFactory(function (t) {
  t["Adobe Jenson"] = true;
  t["Adobe Text"] = true;
  t.Albertus = true;
  t.Aldus = true;
  t.Alexandria = true;
  t.Algerian = true;
  t["American Typewriter"] = true;
  t.Antiqua = true;
  t.Apex = true;
  t.Arno = true;
  t.Aster = true;
  t.Aurora = true;
  t.Baskerville = true;
  t.Bell = true;
  t.Bembo = true;
  t["Bembo Schoolbook"] = true;
  t.Benguiat = true;
  t["Berkeley Old Style"] = true;
  t["Bernhard Modern"] = true;
  t["Berthold City"] = true;
  t.Bodoni = true;
  t["Bauer Bodoni"] = true;
  t["Book Antiqua"] = true;
  t.Bookman = true;
  t["Bordeaux Roman"] = true;
  t["Californian FB"] = true;
  t.Calisto = true;
  t.Calvert = true;
  t.Capitals = true;
  t.Cambria = true;
  t.Cartier = true;
  t.Caslon = true;
  t.Catull = true;
  t.Centaur = true;
  t["Century Old Style"] = true;
  t["Century Schoolbook"] = true;
  t.Chaparral = true;
  t["Charis SIL"] = true;
  t.Cheltenham = true;
  t["Cholla Slab"] = true;
  t.Clarendon = true;
  t.Clearface = true;
  t.Cochin = true;
  t.Colonna = true;
  t["Computer Modern"] = true;
  t["Concrete Roman"] = true;
  t.Constantia = true;
  t["Cooper Black"] = true;
  t.Corona = true;
  t.Ecotype = true;
  t.Egyptienne = true;
  t.Elephant = true;
  t.Excelsior = true;
  t.Fairfield = true;
  t["FF Scala"] = true;
  t.Folkard = true;
  t.Footlight = true;
  t.FreeSerif = true;
  t["Friz Quadrata"] = true;
  t.Garamond = true;
  t.Gentium = true;
  t.Georgia = true;
  t.Gloucester = true;
  t["Goudy Old Style"] = true;
  t["Goudy Schoolbook"] = true;
  t["Goudy Pro Font"] = true;
  t.Granjon = true;
  t["Guardian Egyptian"] = true;
  t.Heather = true;
  t.Hercules = true;
  t["High Tower Text"] = true;
  t.Hiroshige = true;
  t["Hoefler Text"] = true;
  t["Humana Serif"] = true;
  t.Imprint = true;
  t["Ionic No. 5"] = true;
  t.Janson = true;
  t.Joanna = true;
  t.Korinna = true;
  t.Lexicon = true;
  t.LiberationSerif = true;
  t["Liberation Serif"] = true;
  t["Linux Libertine"] = true;
  t.Literaturnaya = true;
  t.Lucida = true;
  t["Lucida Bright"] = true;
  t.Melior = true;
  t.Memphis = true;
  t.Miller = true;
  t.Minion = true;
  t.Modern = true;
  t["Mona Lisa"] = true;
  t["Mrs Eaves"] = true;
  t["MS Serif"] = true;
  t["Museo Slab"] = true;
  t["New York"] = true;
  t["Nimbus Roman"] = true;
  t["NPS Rawlinson Roadway"] = true;
  t.NuptialScript = true;
  t.Palatino = true;
  t.Perpetua = true;
  t.Plantin = true;
  t["Plantin Schoolbook"] = true;
  t.Playbill = true;
  t["Poor Richard"] = true;
  t["Rawlinson Roadway"] = true;
  t.Renault = true;
  t.Requiem = true;
  t.Rockwell = true;
  t.Roman = true;
  t["Rotis Serif"] = true;
  t.Sabon = true;
  t.Scala = true;
  t.Seagull = true;
  t.Sistina = true;
  t.Souvenir = true;
  t.STIX = true;
  t["Stone Informal"] = true;
  t["Stone Serif"] = true;
  t.Sylfaen = true;
  t.Times = true;
  t.Trajan = true;
  t["Trinité"] = true;
  t["Trump Mediaeval"] = true;
  t.Utopia = true;
  t["Vale Type"] = true;
  t["Bitstream Vera"] = true;
  t["Vera Serif"] = true;
  t.Versailles = true;
  t.Wanted = true;
  t.Weiss = true;
  t["Wide Latin"] = true;
  t.Windsor = true;
  t.XITS = true;
});
const getSymbolsFonts = getLookupTableFactory(function (t) {
  t.Dingbats = true;
  t.Symbol = true;
  t.ZapfDingbats = true;
  t.Wingdings = true;
  t["Wingdings-Bold"] = true;
  t["Wingdings-Regular"] = true;
});
const getGlyphMapForStandardFonts = getLookupTableFactory(function (t) {
  t[2] = 10;
  t[3] = 32;
  t[4] = 33;
  t[5] = 34;
  t[6] = 35;
  t[7] = 36;
  t[8] = 37;
  t[9] = 38;
  t[10] = 39;
  t[11] = 40;
  t[12] = 41;
  t[13] = 42;
  t[14] = 43;
  t[15] = 44;
  t[16] = 45;
  t[17] = 46;
  t[18] = 47;
  t[19] = 48;
  t[20] = 49;
  t[21] = 50;
  t[22] = 51;
  t[23] = 52;
  t[24] = 53;
  t[25] = 54;
  t[26] = 55;
  t[27] = 56;
  t[28] = 57;
  t[29] = 58;
  t[30] = 894;
  t[31] = 60;
  t[32] = 61;
  t[33] = 62;
  t[34] = 63;
  t[35] = 64;
  t[36] = 65;
  t[37] = 66;
  t[38] = 67;
  t[39] = 68;
  t[40] = 69;
  t[41] = 70;
  t[42] = 71;
  t[43] = 72;
  t[44] = 73;
  t[45] = 74;
  t[46] = 75;
  t[47] = 76;
  t[48] = 77;
  t[49] = 78;
  t[50] = 79;
  t[51] = 80;
  t[52] = 81;
  t[53] = 82;
  t[54] = 83;
  t[55] = 84;
  t[56] = 85;
  t[57] = 86;
  t[58] = 87;
  t[59] = 88;
  t[60] = 89;
  t[61] = 90;
  t[62] = 91;
  t[63] = 92;
  t[64] = 93;
  t[65] = 94;
  t[66] = 95;
  t[67] = 96;
  t[68] = 97;
  t[69] = 98;
  t[70] = 99;
  t[71] = 100;
  t[72] = 101;
  t[73] = 102;
  t[74] = 103;
  t[75] = 104;
  t[76] = 105;
  t[77] = 106;
  t[78] = 107;
  t[79] = 108;
  t[80] = 109;
  t[81] = 110;
  t[82] = 111;
  t[83] = 112;
  t[84] = 113;
  t[85] = 114;
  t[86] = 115;
  t[87] = 116;
  t[88] = 117;
  t[89] = 118;
  t[90] = 119;
  t[91] = 120;
  t[92] = 121;
  t[93] = 122;
  t[94] = 123;
  t[95] = 124;
  t[96] = 125;
  t[97] = 126;
  t[98] = 196;
  t[99] = 197;
  t[100] = 199;
  t[101] = 201;
  t[102] = 209;
  t[103] = 214;
  t[104] = 220;
  t[105] = 225;
  t[106] = 224;
  t[107] = 226;
  t[108] = 228;
  t[109] = 227;
  t[110] = 229;
  t[111] = 231;
  t[112] = 233;
  t[113] = 232;
  t[114] = 234;
  t[115] = 235;
  t[116] = 237;
  t[117] = 236;
  t[118] = 238;
  t[119] = 239;
  t[120] = 241;
  t[121] = 243;
  t[122] = 242;
  t[123] = 244;
  t[124] = 246;
  t[125] = 245;
  t[126] = 250;
  t[127] = 249;
  t[128] = 251;
  t[129] = 252;
  t[130] = 8224;
  t[131] = 176;
  t[132] = 162;
  t[133] = 163;
  t[134] = 167;
  t[135] = 8226;
  t[136] = 182;
  t[137] = 223;
  t[138] = 174;
  t[139] = 169;
  t[140] = 8482;
  t[141] = 180;
  t[142] = 168;
  t[143] = 8800;
  t[144] = 198;
  t[145] = 216;
  t[146] = 8734;
  t[147] = 177;
  t[148] = 8804;
  t[149] = 8805;
  t[150] = 165;
  t[151] = 181;
  t[152] = 8706;
  t[153] = 8721;
  t[154] = 8719;
  t[156] = 8747;
  t[157] = 170;
  t[158] = 186;
  t[159] = 8486;
  t[160] = 230;
  t[161] = 248;
  t[162] = 191;
  t[163] = 161;
  t[164] = 172;
  t[165] = 8730;
  t[166] = 402;
  t[167] = 8776;
  t[168] = 8710;
  t[169] = 171;
  t[170] = 187;
  t[171] = 8230;
  t[179] = 8220;
  t[180] = 8221;
  t[181] = 8216;
  t[182] = 8217;
  t[200] = 193;
  t[203] = 205;
  t[207] = 211;
  t[210] = 218;
  t[223] = 711;
  t[224] = 321;
  t[225] = 322;
  t[226] = 352;
  t[227] = 353;
  t[228] = 381;
  t[229] = 382;
  t[233] = 221;
  t[234] = 253;
  t[252] = 263;
  t[253] = 268;
  t[254] = 269;
  t[258] = 258;
  t[260] = 260;
  t[261] = 261;
  t[265] = 280;
  t[266] = 281;
  t[267] = 282;
  t[268] = 283;
  t[269] = 313;
  t[275] = 323;
  t[276] = 324;
  t[278] = 328;
  t[283] = 344;
  t[284] = 345;
  t[285] = 346;
  t[286] = 347;
  t[292] = 367;
  t[295] = 377;
  t[296] = 378;
  t[298] = 380;
  t[305] = 963;
  t[306] = 964;
  t[307] = 966;
  t[308] = 8215;
  t[309] = 8252;
  t[310] = 8319;
  t[311] = 8359;
  t[312] = 8592;
  t[313] = 8593;
  t[337] = 9552;
  t[493] = 1039;
  t[494] = 1040;
  t[570] = 1040;
  t[571] = 1041;
  t[572] = 1042;
  t[573] = 1043;
  t[574] = 1044;
  t[575] = 1045;
  t[576] = 1046;
  t[577] = 1047;
  t[578] = 1048;
  t[579] = 1049;
  t[580] = 1050;
  t[581] = 1051;
  t[582] = 1052;
  t[583] = 1053;
  t[584] = 1054;
  t[585] = 1055;
  t[586] = 1056;
  t[587] = 1057;
  t[588] = 1058;
  t[589] = 1059;
  t[590] = 1060;
  t[591] = 1061;
  t[592] = 1062;
  t[593] = 1063;
  t[594] = 1064;
  t[595] = 1065;
  t[596] = 1066;
  t[597] = 1067;
  t[598] = 1068;
  t[599] = 1069;
  t[600] = 1070;
  t[672] = 1488;
  t[673] = 1489;
  t[674] = 1490;
  t[675] = 1491;
  t[676] = 1492;
  t[677] = 1493;
  t[678] = 1494;
  t[679] = 1495;
  t[680] = 1496;
  t[681] = 1497;
  t[682] = 1498;
  t[683] = 1499;
  t[684] = 1500;
  t[685] = 1501;
  t[686] = 1502;
  t[687] = 1503;
  t[688] = 1504;
  t[689] = 1505;
  t[690] = 1506;
  t[691] = 1507;
  t[692] = 1508;
  t[693] = 1509;
  t[694] = 1510;
  t[695] = 1511;
  t[696] = 1512;
  t[697] = 1513;
  t[698] = 1514;
  t[705] = 1524;
  t[706] = 8362;
  t[710] = 64288;
  t[711] = 64298;
  t[759] = 1617;
  t[761] = 1776;
  t[763] = 1778;
  t[775] = 1652;
  t[777] = 1764;
  t[778] = 1780;
  t[779] = 1781;
  t[780] = 1782;
  t[782] = 771;
  t[783] = 64726;
  t[786] = 8363;
  t[788] = 8532;
  t[790] = 768;
  t[791] = 769;
  t[792] = 768;
  t[795] = 803;
  t[797] = 64336;
  t[798] = 64337;
  t[799] = 64342;
  t[800] = 64343;
  t[801] = 64344;
  t[802] = 64345;
  t[803] = 64362;
  t[804] = 64363;
  t[805] = 64364;
  t[2424] = 7821;
  t[2425] = 7822;
  t[2426] = 7823;
  t[2427] = 7824;
  t[2428] = 7825;
  t[2429] = 7826;
  t[2430] = 7827;
  t[2433] = 7682;
  t[2678] = 8045;
  t[2679] = 8046;
  t[2830] = 1552;
  t[2838] = 686;
  t[2840] = 751;
  t[2842] = 753;
  t[2843] = 754;
  t[2844] = 755;
  t[2846] = 757;
  t[2856] = 767;
  t[2857] = 848;
  t[2858] = 849;
  t[2862] = 853;
  t[2863] = 854;
  t[2864] = 855;
  t[2865] = 861;
  t[2866] = 862;
  t[2906] = 7460;
  t[2908] = 7462;
  t[2909] = 7463;
  t[2910] = 7464;
  t[2912] = 7466;
  t[2913] = 7467;
  t[2914] = 7468;
  t[2916] = 7470;
  t[2917] = 7471;
  t[2918] = 7472;
  t[2920] = 7474;
  t[2921] = 7475;
  t[2922] = 7476;
  t[2924] = 7478;
  t[2925] = 7479;
  t[2926] = 7480;
  t[2928] = 7482;
  t[2929] = 7483;
  t[2930] = 7484;
  t[2932] = 7486;
  t[2933] = 7487;
  t[2934] = 7488;
  t[2936] = 7490;
  t[2937] = 7491;
  t[2938] = 7492;
  t[2940] = 7494;
  t[2941] = 7495;
  t[2942] = 7496;
  t[2944] = 7498;
  t[2946] = 7500;
  t[2948] = 7502;
  t[2950] = 7504;
  t[2951] = 7505;
  t[2952] = 7506;
  t[2954] = 7508;
  t[2955] = 7509;
  t[2956] = 7510;
  t[2958] = 7512;
  t[2959] = 7513;
  t[2960] = 7514;
  t[2962] = 7516;
  t[2963] = 7517;
  t[2964] = 7518;
  t[2966] = 7520;
  t[2967] = 7521;
  t[2968] = 7522;
  t[2970] = 7524;
  t[2971] = 7525;
  t[2972] = 7526;
  t[2974] = 7528;
  t[2975] = 7529;
  t[2976] = 7530;
  t[2978] = 1537;
  t[2979] = 1538;
  t[2980] = 1539;
  t[2982] = 1549;
  t[2983] = 1551;
  t[2984] = 1552;
  t[2986] = 1554;
  t[2987] = 1555;
  t[2988] = 1556;
  t[2990] = 1623;
  t[2991] = 1624;
  t[2995] = 1775;
  t[2999] = 1791;
  t[3002] = 64290;
  t[3003] = 64291;
  t[3004] = 64292;
  t[3006] = 64294;
  t[3007] = 64295;
  t[3008] = 64296;
  t[3011] = 1900;
  t[3014] = 8223;
  t[3015] = 8244;
  t[3017] = 7532;
  t[3018] = 7533;
  t[3019] = 7534;
  t[3075] = 7590;
  t[3076] = 7591;
  t[3079] = 7594;
  t[3080] = 7595;
  t[3083] = 7598;
  t[3084] = 7599;
  t[3087] = 7602;
  t[3088] = 7603;
  t[3091] = 7606;
  t[3092] = 7607;
  t[3095] = 7610;
  t[3096] = 7611;
  t[3099] = 7614;
  t[3100] = 7615;
  t[3103] = 7618;
  t[3104] = 7619;
  t[3107] = 8337;
  t[3108] = 8338;
  t[3116] = 1884;
  t[3119] = 1885;
  t[3120] = 1885;
  t[3123] = 1886;
  t[3124] = 1886;
  t[3127] = 1887;
  t[3128] = 1887;
  t[3131] = 1888;
  t[3132] = 1888;
  t[3135] = 1889;
  t[3136] = 1889;
  t[3139] = 1890;
  t[3140] = 1890;
  t[3143] = 1891;
  t[3144] = 1891;
  t[3147] = 1892;
  t[3148] = 1892;
  t[3153] = 580;
  t[3154] = 581;
  t[3157] = 584;
  t[3158] = 585;
  t[3161] = 588;
  t[3162] = 589;
  t[3165] = 891;
  t[3166] = 892;
  t[3169] = 1274;
  t[3170] = 1275;
  t[3173] = 1278;
  t[3174] = 1279;
  t[3181] = 7622;
  t[3182] = 7623;
  t[3282] = 11799;
  t[3316] = 578;
  t[3379] = 42785;
  t[3393] = 1159;
  t[3416] = 8377;
});
const getSupplementalGlyphMapForArialBlack = getLookupTableFactory(function (t) {
  t[227] = 322;
  t[264] = 261;
  t[291] = 346;
});
const getSupplementalGlyphMapForCalibri = getLookupTableFactory(function (t) {
  t[1] = 32;
  t[4] = 65;
  t[5] = 192;
  t[6] = 193;
  t[9] = 196;
  t[17] = 66;
  t[18] = 67;
  t[21] = 268;
  t[24] = 68;
  t[28] = 69;
  t[29] = 200;
  t[30] = 201;
  t[32] = 282;
  t[38] = 70;
  t[39] = 71;
  t[44] = 72;
  t[47] = 73;
  t[48] = 204;
  t[49] = 205;
  t[58] = 74;
  t[60] = 75;
  t[62] = 76;
  t[68] = 77;
  t[69] = 78;
  t[75] = 79;
  t[76] = 210;
  t[80] = 214;
  t[87] = 80;
  t[89] = 81;
  t[90] = 82;
  t[92] = 344;
  t[94] = 83;
  t[97] = 352;
  t[100] = 84;
  t[104] = 85;
  t[109] = 220;
  t[115] = 86;
  t[116] = 87;
  t[121] = 88;
  t[122] = 89;
  t[124] = 221;
  t[127] = 90;
  t[129] = 381;
  t[258] = 97;
  t[259] = 224;
  t[260] = 225;
  t[263] = 228;
  t[268] = 261;
  t[271] = 98;
  t[272] = 99;
  t[273] = 263;
  t[275] = 269;
  t[282] = 100;
  t[286] = 101;
  t[287] = 232;
  t[288] = 233;
  t[290] = 283;
  t[295] = 281;
  t[296] = 102;
  t[336] = 103;
  t[346] = 104;
  t[349] = 105;
  t[350] = 236;
  t[351] = 237;
  t[361] = 106;
  t[364] = 107;
  t[367] = 108;
  t[371] = 322;
  t[373] = 109;
  t[374] = 110;
  t[381] = 111;
  t[382] = 242;
  t[383] = 243;
  t[386] = 246;
  t[393] = 112;
  t[395] = 113;
  t[396] = 114;
  t[398] = 345;
  t[400] = 115;
  t[401] = 347;
  t[403] = 353;
  t[410] = 116;
  t[437] = 117;
  t[442] = 252;
  t[448] = 118;
  t[449] = 119;
  t[454] = 120;
  t[455] = 121;
  t[457] = 253;
  t[460] = 122;
  t[462] = 382;
  t[463] = 380;
  t[853] = 44;
  t[855] = 58;
  t[856] = 46;
  t[876] = 47;
  t[878] = 45;
  t[882] = 45;
  t[894] = 40;
  t[895] = 41;
  t[896] = 91;
  t[897] = 93;
  t[923] = 64;
  t[940] = 163;
  t[1004] = 48;
  t[1005] = 49;
  t[1006] = 50;
  t[1007] = 51;
  t[1008] = 52;
  t[1009] = 53;
  t[1010] = 54;
  t[1011] = 55;
  t[1012] = 56;
  t[1013] = 57;
  t[1081] = 37;
  t[1085] = 43;
  t[1086] = 45;
});
function getStandardFontName(name) {
  const fontName = normalizeFontName(name);
  const stdFontMap = getStdFontMap();
  return stdFontMap[fontName];
}
function isKnownFontName(name) {
  const fontName = normalizeFontName(name);
  return !!(getStdFontMap()[fontName] || getNonStdFontMap()[fontName] || getSerifFonts()[fontName] || getSymbolsFonts()[fontName]);
}

;// ./src/core/to_unicode_map.js

class ToUnicodeMap {
  constructor(cmap = []) {
    this._map = cmap;
  }
  get length() {
    return this._map.length;
  }
  forEach(callback) {
    for (const charCode in this._map) {
      callback(charCode, this._map[charCode].codePointAt(0));
    }
  }
  has(i) {
    return this._map[i] !== undefined;
  }
  get(i) {
    return this._map[i];
  }
  charCodeOf(value) {
    const map = this._map;
    if (map.length <= 0x10000) {
      return map.indexOf(value);
    }
    for (const charCode in map) {
      if (map[charCode] === value) {
        return charCode | 0;
      }
    }
    return -1;
  }
  amend(map) {
    for (const charCode in map) {
      this._map[charCode] = map[charCode];
    }
  }
}
class IdentityToUnicodeMap {
  constructor(firstChar, lastChar) {
    this.firstChar = firstChar;
    this.lastChar = lastChar;
  }
  get length() {
    return this.lastChar + 1 - this.firstChar;
  }
  forEach(callback) {
    for (let i = this.firstChar, ii = this.lastChar; i <= ii; i++) {
      callback(i, i);
    }
  }
  has(i) {
    return this.firstChar <= i && i <= this.lastChar;
  }
  get(i) {
    if (this.firstChar <= i && i <= this.lastChar) {
      return String.fromCharCode(i);
    }
    return undefined;
  }
  charCodeOf(v) {
    return Number.isInteger(v) && v >= this.firstChar && v <= this.lastChar ? v : -1;
  }
  amend(map) {
    unreachable("Should not call amend()");
  }
}

;// ./src/core/cff_font.js



class CFFFont {
  constructor(file, properties) {
    this.properties = properties;
    const parser = new CFFParser(file, properties, SEAC_ANALYSIS_ENABLED);
    this.cff = parser.parse();
    this.cff.duplicateFirstGlyph();
    const compiler = new CFFCompiler(this.cff);
    this.seacs = this.cff.seacs;
    try {
      this.data = compiler.compile();
    } catch {
      warn("Failed to compile font " + properties.loadedName);
      this.data = file;
    }
    this._createBuiltInEncoding();
  }
  get numGlyphs() {
    return this.cff.charStrings.count;
  }
  getCharset() {
    return this.cff.charset.charset;
  }
  getGlyphMapping() {
    const cff = this.cff;
    const properties = this.properties;
    const {
      cidToGidMap,
      cMap
    } = properties;
    const charsets = cff.charset.charset;
    let charCodeToGlyphId;
    let glyphId;
    if (properties.composite) {
      let invCidToGidMap;
      if (cidToGidMap?.length > 0) {
        invCidToGidMap = Object.create(null);
        for (let i = 0, ii = cidToGidMap.length; i < ii; i++) {
          const gid = cidToGidMap[i];
          if (gid !== undefined) {
            invCidToGidMap[gid] = i;
          }
        }
      }
      charCodeToGlyphId = Object.create(null);
      let charCode;
      if (cff.isCIDFont) {
        for (glyphId = 0; glyphId < charsets.length; glyphId++) {
          const cid = charsets[glyphId];
          charCode = cMap.charCodeOf(cid);
          if (invCidToGidMap?.[charCode] !== undefined) {
            charCode = invCidToGidMap[charCode];
          }
          charCodeToGlyphId[charCode] = glyphId;
        }
      } else {
        for (glyphId = 0; glyphId < cff.charStrings.count; glyphId++) {
          charCode = cMap.charCodeOf(glyphId);
          charCodeToGlyphId[charCode] = glyphId;
        }
      }
      return charCodeToGlyphId;
    }
    let encoding = cff.encoding ? cff.encoding.encoding : null;
    if (properties.isInternalFont) {
      encoding = properties.defaultEncoding;
    }
    charCodeToGlyphId = type1FontGlyphMapping(properties, encoding, charsets);
    return charCodeToGlyphId;
  }
  hasGlyphId(id) {
    return this.cff.hasGlyphId(id);
  }
  _createBuiltInEncoding() {
    const {
      charset,
      encoding
    } = this.cff;
    if (!charset || !encoding) {
      return;
    }
    const charsets = charset.charset,
      encodings = encoding.encoding;
    const map = [];
    for (const charCode in encodings) {
      const glyphId = encodings[charCode];
      if (glyphId >= 0) {
        const glyphName = charsets[glyphId];
        if (glyphName) {
          map[charCode] = glyphName;
        }
      }
    }
    if (map.length > 0) {
      this.properties.builtInEncoding = map;
    }
  }
}

;// ./src/core/font_renderer.js















function getFloat214(data, offset) {
  return readInt16(data, offset) / 16384;
}
function getSubroutineBias(subrs) {
  const numSubrs = subrs.length;
  let bias = 32768;
  if (numSubrs < 1240) {
    bias = 107;
  } else if (numSubrs < 33900) {
    bias = 1131;
  }
  return bias;
}
function parseCmap(data, start, end) {
  const offset = readUint16(data, start + 2) === 1 ? readUint32(data, start + 8) : readUint32(data, start + 16);
  const format = readUint16(data, start + offset);
  let ranges, p, i;
  if (format === 4) {
    readUint16(data, start + offset + 2);
    const segCount = readUint16(data, start + offset + 6) >> 1;
    p = start + offset + 14;
    ranges = [];
    for (i = 0; i < segCount; i++, p += 2) {
      ranges[i] = {
        end: readUint16(data, p)
      };
    }
    p += 2;
    for (i = 0; i < segCount; i++, p += 2) {
      ranges[i].start = readUint16(data, p);
    }
    for (i = 0; i < segCount; i++, p += 2) {
      ranges[i].idDelta = readUint16(data, p);
    }
    for (i = 0; i < segCount; i++, p += 2) {
      let idOffset = readUint16(data, p);
      if (idOffset === 0) {
        continue;
      }
      ranges[i].ids = [];
      for (let j = 0, jj = ranges[i].end - ranges[i].start + 1; j < jj; j++) {
        ranges[i].ids[j] = readUint16(data, p + idOffset);
        idOffset += 2;
      }
    }
    return ranges;
  } else if (format === 12) {
    const groups = readUint32(data, start + offset + 12);
    p = start + offset + 16;
    ranges = [];
    for (i = 0; i < groups; i++) {
      start = readUint32(data, p);
      ranges.push({
        start,
        end: readUint32(data, p + 4),
        idDelta: readUint32(data, p + 8) - start
      });
      p += 12;
    }
    return ranges;
  }
  throw new FormatError(`unsupported cmap: ${format}`);
}
function parseCff(data, start, end, seacAnalysisEnabled) {
  const properties = {};
  const parser = new CFFParser(new Stream(data, start, end - start), properties, seacAnalysisEnabled);
  const cff = parser.parse();
  return {
    glyphs: cff.charStrings.objects,
    subrs: cff.topDict.privateDict?.subrsIndex?.objects,
    gsubrs: cff.globalSubrIndex?.objects,
    isCFFCIDFont: cff.isCIDFont,
    fdSelect: cff.fdSelect,
    fdArray: cff.fdArray
  };
}
function parseGlyfTable(glyf, loca, isGlyphLocationsLong) {
  let itemSize, itemDecode;
  if (isGlyphLocationsLong) {
    itemSize = 4;
    itemDecode = readUint32;
  } else {
    itemSize = 2;
    itemDecode = (data, offset) => 2 * readUint16(data, offset);
  }
  const glyphs = [];
  let startOffset = itemDecode(loca, 0);
  for (let j = itemSize; j < loca.length; j += itemSize) {
    const endOffset = itemDecode(loca, j);
    glyphs.push(glyf.subarray(startOffset, endOffset));
    startOffset = endOffset;
  }
  return glyphs;
}
function lookupCmap(ranges, unicode) {
  const code = unicode.codePointAt(0);
  let gid = 0,
    l = 0,
    r = ranges.length - 1;
  while (l < r) {
    const c = l + r + 1 >> 1;
    if (code < ranges[c].start) {
      r = c - 1;
    } else {
      l = c;
    }
  }
  if (ranges[l].start <= code && code <= ranges[l].end) {
    gid = ranges[l].idDelta + (ranges[l].ids ? ranges[l].ids[code - ranges[l].start] : code) & 0xffff;
  }
  return {
    charCode: code,
    glyphId: gid
  };
}
function compileGlyf(code, cmds, font) {
  function moveTo(x, y) {
    if (firstPoint) {
      cmds.add("L", firstPoint);
    }
    firstPoint = [x, y];
    cmds.add("M", [x, y]);
  }
  function lineTo(x, y) {
    cmds.add("L", [x, y]);
  }
  function quadraticCurveTo(xa, ya, x, y) {
    cmds.add("Q", [xa, ya, x, y]);
  }
  let i = 0;
  const numberOfContours = readInt16(code, i);
  let flags;
  let firstPoint = null;
  let x = 0,
    y = 0;
  i += 10;
  if (numberOfContours < 0) {
    do {
      flags = readUint16(code, i);
      const glyphIndex = readUint16(code, i + 2);
      i += 4;
      let arg1, arg2;
      if (flags & 0x01) {
        if (flags & 0x02) {
          arg1 = readInt16(code, i);
          arg2 = readInt16(code, i + 2);
        } else {
          arg1 = readUint16(code, i);
          arg2 = readUint16(code, i + 2);
        }
        i += 4;
      } else if (flags & 0x02) {
        arg1 = readInt8(code, i++);
        arg2 = readInt8(code, i++);
      } else {
        arg1 = code[i++];
        arg2 = code[i++];
      }
      if (flags & 0x02) {
        x = arg1;
        y = arg2;
      } else {
        x = 0;
        y = 0;
      }
      let scaleX = 1,
        scaleY = 1,
        scale01 = 0,
        scale10 = 0;
      if (flags & 0x08) {
        scaleX = scaleY = getFloat214(code, i);
        i += 2;
      } else if (flags & 0x40) {
        scaleX = getFloat214(code, i);
        scaleY = getFloat214(code, i + 2);
        i += 4;
      } else if (flags & 0x80) {
        scaleX = getFloat214(code, i);
        scale01 = getFloat214(code, i + 2);
        scale10 = getFloat214(code, i + 4);
        scaleY = getFloat214(code, i + 6);
        i += 8;
      }
      const subglyph = font.glyphs[glyphIndex];
      if (subglyph) {
        cmds.save();
        cmds.transform([scaleX, scale01, scale10, scaleY, x, y]);
        if (!(flags & 0x02)) {}
        compileGlyf(subglyph, cmds, font);
        cmds.restore();
      }
    } while (flags & 0x20);
  } else {
    const endPtsOfContours = [];
    let j, jj;
    for (j = 0; j < numberOfContours; j++) {
      endPtsOfContours.push(readUint16(code, i));
      i += 2;
    }
    const instructionLength = readUint16(code, i);
    i += 2 + instructionLength;
    const numberOfPoints = endPtsOfContours.at(-1) + 1;
    const points = [];
    while (points.length < numberOfPoints) {
      flags = code[i++];
      let repeat = 1;
      if (flags & 0x08) {
        repeat += code[i++];
      }
      while (repeat-- > 0) {
        points.push({
          flags
        });
      }
    }
    for (j = 0; j < numberOfPoints; j++) {
      switch (points[j].flags & 0x12) {
        case 0x00:
          x += readInt16(code, i);
          i += 2;
          break;
        case 0x02:
          x -= code[i++];
          break;
        case 0x12:
          x += code[i++];
          break;
      }
      points[j].x = x;
    }
    for (j = 0; j < numberOfPoints; j++) {
      switch (points[j].flags & 0x24) {
        case 0x00:
          y += readInt16(code, i);
          i += 2;
          break;
        case 0x04:
          y -= code[i++];
          break;
        case 0x24:
          y += code[i++];
          break;
      }
      points[j].y = y;
    }
    let startPoint = 0;
    for (i = 0; i < numberOfContours; i++) {
      const endPoint = endPtsOfContours[i];
      const contour = points.slice(startPoint, endPoint + 1);
      if (contour[0].flags & 1) {
        contour.push(contour[0]);
      } else if (contour.at(-1).flags & 1) {
        contour.unshift(contour.at(-1));
      } else {
        const p = {
          flags: 1,
          x: (contour[0].x + contour.at(-1).x) / 2,
          y: (contour[0].y + contour.at(-1).y) / 2
        };
        contour.unshift(p);
        contour.push(p);
      }
      moveTo(contour[0].x, contour[0].y);
      for (j = 1, jj = contour.length; j < jj; j++) {
        if (contour[j].flags & 1) {
          lineTo(contour[j].x, contour[j].y);
        } else if (contour[j + 1].flags & 1) {
          quadraticCurveTo(contour[j].x, contour[j].y, contour[j + 1].x, contour[j + 1].y);
          j++;
        } else {
          quadraticCurveTo(contour[j].x, contour[j].y, (contour[j].x + contour[j + 1].x) / 2, (contour[j].y + contour[j + 1].y) / 2);
        }
      }
      startPoint = endPoint + 1;
    }
  }
}
function compileCharString(charStringCode, cmds, font, glyphId) {
  function moveTo(x, y) {
    if (firstPoint) {
      cmds.add("L", firstPoint);
    }
    firstPoint = [x, y];
    cmds.add("M", [x, y]);
  }
  function lineTo(x, y) {
    cmds.add("L", [x, y]);
  }
  function bezierCurveTo(x1, y1, x2, y2, x, y) {
    cmds.add("C", [x1, y1, x2, y2, x, y]);
  }
  const stack = [];
  let x = 0,
    y = 0;
  let stems = 0;
  let firstPoint = null;
  function parse(code) {
    let i = 0;
    while (i < code.length) {
      let stackClean = false;
      let v = code[i++];
      let xa, xb, ya, yb, y1, y2, y3, n, subrCode;
      switch (v) {
        case 1:
          stems += stack.length >> 1;
          stackClean = true;
          break;
        case 3:
          stems += stack.length >> 1;
          stackClean = true;
          break;
        case 4:
          y += stack.pop();
          moveTo(x, y);
          stackClean = true;
          break;
        case 5:
          while (stack.length > 0) {
            x += stack.shift();
            y += stack.shift();
            lineTo(x, y);
          }
          break;
        case 6:
          while (stack.length > 0) {
            x += stack.shift();
            lineTo(x, y);
            if (stack.length === 0) {
              break;
            }
            y += stack.shift();
            lineTo(x, y);
          }
          break;
        case 7:
          while (stack.length > 0) {
            y += stack.shift();
            lineTo(x, y);
            if (stack.length === 0) {
              break;
            }
            x += stack.shift();
            lineTo(x, y);
          }
          break;
        case 8:
          while (stack.length > 0) {
            xa = x + stack.shift();
            ya = y + stack.shift();
            xb = xa + stack.shift();
            yb = ya + stack.shift();
            x = xb + stack.shift();
            y = yb + stack.shift();
            bezierCurveTo(xa, ya, xb, yb, x, y);
          }
          break;
        case 10:
          n = stack.pop();
          subrCode = null;
          if (font.isCFFCIDFont) {
            const fdIndex = font.fdSelect.getFDIndex(glyphId);
            if (fdIndex >= 0 && fdIndex < font.fdArray.length) {
              const fontDict = font.fdArray[fdIndex];
              let subrs;
              if (fontDict.privateDict?.subrsIndex) {
                subrs = fontDict.privateDict.subrsIndex.objects;
              }
              if (subrs) {
                n += getSubroutineBias(subrs);
                subrCode = subrs[n];
              }
            } else {
              warn("Invalid fd index for glyph index.");
            }
          } else {
            subrCode = font.subrs[n + font.subrsBias];
          }
          if (subrCode) {
            parse(subrCode);
          }
          break;
        case 11:
          return;
        case 12:
          v = code[i++];
          switch (v) {
            case 34:
              xa = x + stack.shift();
              xb = xa + stack.shift();
              y1 = y + stack.shift();
              x = xb + stack.shift();
              bezierCurveTo(xa, y, xb, y1, x, y1);
              xa = x + stack.shift();
              xb = xa + stack.shift();
              x = xb + stack.shift();
              bezierCurveTo(xa, y1, xb, y, x, y);
              break;
            case 35:
              xa = x + stack.shift();
              ya = y + stack.shift();
              xb = xa + stack.shift();
              yb = ya + stack.shift();
              x = xb + stack.shift();
              y = yb + stack.shift();
              bezierCurveTo(xa, ya, xb, yb, x, y);
              xa = x + stack.shift();
              ya = y + stack.shift();
              xb = xa + stack.shift();
              yb = ya + stack.shift();
              x = xb + stack.shift();
              y = yb + stack.shift();
              bezierCurveTo(xa, ya, xb, yb, x, y);
              stack.pop();
              break;
            case 36:
              xa = x + stack.shift();
              y1 = y + stack.shift();
              xb = xa + stack.shift();
              y2 = y1 + stack.shift();
              x = xb + stack.shift();
              bezierCurveTo(xa, y1, xb, y2, x, y2);
              xa = x + stack.shift();
              xb = xa + stack.shift();
              y3 = y2 + stack.shift();
              x = xb + stack.shift();
              bezierCurveTo(xa, y2, xb, y3, x, y);
              break;
            case 37:
              const x0 = x,
                y0 = y;
              xa = x + stack.shift();
              ya = y + stack.shift();
              xb = xa + stack.shift();
              yb = ya + stack.shift();
              x = xb + stack.shift();
              y = yb + stack.shift();
              bezierCurveTo(xa, ya, xb, yb, x, y);
              xa = x + stack.shift();
              ya = y + stack.shift();
              xb = xa + stack.shift();
              yb = ya + stack.shift();
              x = xb;
              y = yb;
              if (Math.abs(x - x0) > Math.abs(y - y0)) {
                x += stack.shift();
              } else {
                y += stack.shift();
              }
              bezierCurveTo(xa, ya, xb, yb, x, y);
              break;
            default:
              throw new FormatError(`unknown operator: 12 ${v}`);
          }
          break;
        case 14:
          if (stack.length >= 4) {
            const achar = stack.pop();
            const bchar = stack.pop();
            y = stack.pop();
            x = stack.pop();
            cmds.save();
            cmds.translate(x, y);
            let cmap = lookupCmap(font.cmap, String.fromCharCode(font.glyphNameMap[StandardEncoding[achar]]));
            compileCharString(font.glyphs[cmap.glyphId], cmds, font, cmap.glyphId);
            cmds.restore();
            cmap = lookupCmap(font.cmap, String.fromCharCode(font.glyphNameMap[StandardEncoding[bchar]]));
            compileCharString(font.glyphs[cmap.glyphId], cmds, font, cmap.glyphId);
          }
          return;
        case 18:
          stems += stack.length >> 1;
          stackClean = true;
          break;
        case 19:
          stems += stack.length >> 1;
          i += stems + 7 >> 3;
          stackClean = true;
          break;
        case 20:
          stems += stack.length >> 1;
          i += stems + 7 >> 3;
          stackClean = true;
          break;
        case 21:
          y += stack.pop();
          x += stack.pop();
          moveTo(x, y);
          stackClean = true;
          break;
        case 22:
          x += stack.pop();
          moveTo(x, y);
          stackClean = true;
          break;
        case 23:
          stems += stack.length >> 1;
          stackClean = true;
          break;
        case 24:
          while (stack.length > 2) {
            xa = x + stack.shift();
            ya = y + stack.shift();
            xb = xa + stack.shift();
            yb = ya + stack.shift();
            x = xb + stack.shift();
            y = yb + stack.shift();
            bezierCurveTo(xa, ya, xb, yb, x, y);
          }
          x += stack.shift();
          y += stack.shift();
          lineTo(x, y);
          break;
        case 25:
          while (stack.length > 6) {
            x += stack.shift();
            y += stack.shift();
            lineTo(x, y);
          }
          xa = x + stack.shift();
          ya = y + stack.shift();
          xb = xa + stack.shift();
          yb = ya + stack.shift();
          x = xb + stack.shift();
          y = yb + stack.shift();
          bezierCurveTo(xa, ya, xb, yb, x, y);
          break;
        case 26:
          if (stack.length % 2) {
            x += stack.shift();
          }
          while (stack.length > 0) {
            xa = x;
            ya = y + stack.shift();
            xb = xa + stack.shift();
            yb = ya + stack.shift();
            x = xb;
            y = yb + stack.shift();
            bezierCurveTo(xa, ya, xb, yb, x, y);
          }
          break;
        case 27:
          if (stack.length % 2) {
            y += stack.shift();
          }
          while (stack.length > 0) {
            xa = x + stack.shift();
            ya = y;
            xb = xa + stack.shift();
            yb = ya + stack.shift();
            x = xb + stack.shift();
            y = yb;
            bezierCurveTo(xa, ya, xb, yb, x, y);
          }
          break;
        case 28:
          stack.push(readInt16(code, i));
          i += 2;
          break;
        case 29:
          n = stack.pop() + font.gsubrsBias;
          subrCode = font.gsubrs[n];
          if (subrCode) {
            parse(subrCode);
          }
          break;
        case 30:
          while (stack.length > 0) {
            xa = x;
            ya = y + stack.shift();
            xb = xa + stack.shift();
            yb = ya + stack.shift();
            x = xb + stack.shift();
            y = yb + (stack.length === 1 ? stack.shift() : 0);
            bezierCurveTo(xa, ya, xb, yb, x, y);
            if (stack.length === 0) {
              break;
            }
            xa = x + stack.shift();
            ya = y;
            xb = xa + stack.shift();
            yb = ya + stack.shift();
            y = yb + stack.shift();
            x = xb + (stack.length === 1 ? stack.shift() : 0);
            bezierCurveTo(xa, ya, xb, yb, x, y);
          }
          break;
        case 31:
          while (stack.length > 0) {
            xa = x + stack.shift();
            ya = y;
            xb = xa + stack.shift();
            yb = ya + stack.shift();
            y = yb + stack.shift();
            x = xb + (stack.length === 1 ? stack.shift() : 0);
            bezierCurveTo(xa, ya, xb, yb, x, y);
            if (stack.length === 0) {
              break;
            }
            xa = x;
            ya = y + stack.shift();
            xb = xa + stack.shift();
            yb = ya + stack.shift();
            x = xb + stack.shift();
            y = yb + (stack.length === 1 ? stack.shift() : 0);
            bezierCurveTo(xa, ya, xb, yb, x, y);
          }
          break;
        default:
          if (v < 32) {
            throw new FormatError(`unknown operator: ${v}`);
          }
          if (v < 247) {
            stack.push(v - 139);
          } else if (v < 251) {
            stack.push((v - 247) * 256 + code[i++] + 108);
          } else if (v < 255) {
            stack.push(-(v - 251) * 256 - code[i++] - 108);
          } else {
            stack.push((code[i] << 24 | code[i + 1] << 16 | code[i + 2] << 8 | code[i + 3]) / 65536);
            i += 4;
          }
          break;
      }
      if (stackClean) {
        stack.length = 0;
      }
    }
  }
  parse(charStringCode);
}
const NOOP = "";
class Commands {
  cmds = [];
  transformStack = [];
  currentTransform = [1, 0, 0, 1, 0, 0];
  add(cmd, args) {
    if (args) {
      const {
        currentTransform
      } = this;
      for (let i = 0, ii = args.length; i < ii; i += 2) {
        Util.applyTransform(args, currentTransform, i);
      }
      this.cmds.push(`${cmd}${args.join(" ")}`);
    } else {
      this.cmds.push(cmd);
    }
  }
  transform(transf) {
    this.currentTransform = Util.transform(this.currentTransform, transf);
  }
  translate(x, y) {
    this.transform([1, 0, 0, 1, x, y]);
  }
  save() {
    this.transformStack.push(this.currentTransform.slice());
  }
  restore() {
    this.currentTransform = this.transformStack.pop() || [1, 0, 0, 1, 0, 0];
  }
  getSVG() {
    return this.cmds.join("");
  }
}
class CompiledFont {
  constructor(fontMatrix) {
    this.fontMatrix = fontMatrix;
    this.compiledGlyphs = Object.create(null);
    this.compiledCharCodeToGlyphId = Object.create(null);
  }
  getPathJs(unicode) {
    const {
      charCode,
      glyphId
    } = lookupCmap(this.cmap, unicode);
    let fn = this.compiledGlyphs[glyphId],
      compileEx;
    if (fn === undefined) {
      try {
        fn = this.compileGlyph(this.glyphs[glyphId], glyphId);
      } catch (ex) {
        fn = NOOP;
        compileEx = ex;
      }
      this.compiledGlyphs[glyphId] = fn;
    }
    this.compiledCharCodeToGlyphId[charCode] ??= glyphId;
    if (compileEx) {
      throw compileEx;
    }
    return fn;
  }
  compileGlyph(code, glyphId) {
    if (!code?.length || code[0] === 14) {
      return NOOP;
    }
    let fontMatrix = this.fontMatrix;
    if (this.isCFFCIDFont) {
      const fdIndex = this.fdSelect.getFDIndex(glyphId);
      if (fdIndex >= 0 && fdIndex < this.fdArray.length) {
        const fontDict = this.fdArray[fdIndex];
        fontMatrix = fontDict.getByName("FontMatrix") || FONT_IDENTITY_MATRIX;
      } else {
        warn("Invalid fd index for glyph index.");
      }
    }
    assert(isNumberArray(fontMatrix, 6), "Expected a valid fontMatrix.");
    const cmds = new Commands();
    cmds.transform(fontMatrix.slice());
    this.compileGlyphImpl(code, cmds, glyphId);
    cmds.add("Z");
    return cmds.getSVG();
  }
  compileGlyphImpl() {
    unreachable("Children classes should implement this.");
  }
  hasBuiltPath(unicode) {
    const {
      charCode,
      glyphId
    } = lookupCmap(this.cmap, unicode);
    return this.compiledGlyphs[glyphId] !== undefined && this.compiledCharCodeToGlyphId[charCode] !== undefined;
  }
}
class TrueTypeCompiled extends CompiledFont {
  constructor(glyphs, cmap, fontMatrix) {
    super(fontMatrix || [0.000488, 0, 0, 0.000488, 0, 0]);
    this.glyphs = glyphs;
    this.cmap = cmap;
  }
  compileGlyphImpl(code, cmds) {
    compileGlyf(code, cmds, this);
  }
}
class Type2Compiled extends CompiledFont {
  constructor(cffInfo, cmap, fontMatrix) {
    super(fontMatrix || [0.001, 0, 0, 0.001, 0, 0]);
    this.glyphs = cffInfo.glyphs;
    this.gsubrs = cffInfo.gsubrs || [];
    this.subrs = cffInfo.subrs || [];
    this.cmap = cmap;
    this.glyphNameMap = getGlyphsUnicode();
    this.gsubrsBias = getSubroutineBias(this.gsubrs);
    this.subrsBias = getSubroutineBias(this.subrs);
    this.isCFFCIDFont = cffInfo.isCFFCIDFont;
    this.fdSelect = cffInfo.fdSelect;
    this.fdArray = cffInfo.fdArray;
  }
  compileGlyphImpl(code, cmds, glyphId) {
    compileCharString(code, cmds, this, glyphId);
  }
}
class FontRendererFactory {
  static create(font, seacAnalysisEnabled) {
    const data = new Uint8Array(font.data);
    let cmap, glyf, loca, cff, indexToLocFormat, unitsPerEm;
    const numTables = readUint16(data, 4);
    for (let i = 0, p = 12; i < numTables; i++, p += 16) {
      const tag = bytesToString(data.subarray(p, p + 4));
      const offset = readUint32(data, p + 8);
      const length = readUint32(data, p + 12);
      switch (tag) {
        case "cmap":
          cmap = parseCmap(data, offset, offset + length);
          break;
        case "glyf":
          glyf = data.subarray(offset, offset + length);
          break;
        case "loca":
          loca = data.subarray(offset, offset + length);
          break;
        case "head":
          unitsPerEm = readUint16(data, offset + 18);
          indexToLocFormat = readUint16(data, offset + 50);
          break;
        case "CFF ":
          cff = parseCff(data, offset, offset + length, seacAnalysisEnabled);
          break;
      }
    }
    if (glyf) {
      const fontMatrix = !unitsPerEm ? font.fontMatrix : [1 / unitsPerEm, 0, 0, 1 / unitsPerEm, 0, 0];
      return new TrueTypeCompiled(parseGlyfTable(glyf, loca, indexToLocFormat), cmap, fontMatrix);
    }
    return new Type2Compiled(cff, cmap, font.fontMatrix);
  }
}

;// ./src/core/metrics.js

const getMetrics = getLookupTableFactory(function (t) {
  t.Courier = 600;
  t["Courier-Bold"] = 600;
  t["Courier-BoldOblique"] = 600;
  t["Courier-Oblique"] = 600;
  t.Helvetica = getLookupTableFactory(function (t) {
    t.space = 278;
    t.exclam = 278;
    t.quotedbl = 355;
    t.numbersign = 556;
    t.dollar = 556;
    t.percent = 889;
    t.ampersand = 667;
    t.quoteright = 222;
    t.parenleft = 333;
    t.parenright = 333;
    t.asterisk = 389;
    t.plus = 584;
    t.comma = 278;
    t.hyphen = 333;
    t.period = 278;
    t.slash = 278;
    t.zero = 556;
    t.one = 556;
    t.two = 556;
    t.three = 556;
    t.four = 556;
    t.five = 556;
    t.six = 556;
    t.seven = 556;
    t.eight = 556;
    t.nine = 556;
    t.colon = 278;
    t.semicolon = 278;
    t.less = 584;
    t.equal = 584;
    t.greater = 584;
    t.question = 556;
    t.at = 1015;
    t.A = 667;
    t.B = 667;
    t.C = 722;
    t.D = 722;
    t.E = 667;
    t.F = 611;
    t.G = 778;
    t.H = 722;
    t.I = 278;
    t.J = 500;
    t.K = 667;
    t.L = 556;
    t.M = 833;
    t.N = 722;
    t.O = 778;
    t.P = 667;
    t.Q = 778;
    t.R = 722;
    t.S = 667;
    t.T = 611;
    t.U = 722;
    t.V = 667;
    t.W = 944;
    t.X = 667;
    t.Y = 667;
    t.Z = 611;
    t.bracketleft = 278;
    t.backslash = 278;
    t.bracketright = 278;
    t.asciicircum = 469;
    t.underscore = 556;
    t.quoteleft = 222;
    t.a = 556;
    t.b = 556;
    t.c = 500;
    t.d = 556;
    t.e = 556;
    t.f = 278;
    t.g = 556;
    t.h = 556;
    t.i = 222;
    t.j = 222;
    t.k = 500;
    t.l = 222;
    t.m = 833;
    t.n = 556;
    t.o = 556;
    t.p = 556;
    t.q = 556;
    t.r = 333;
    t.s = 500;
    t.t = 278;
    t.u = 556;
    t.v = 500;
    t.w = 722;
    t.x = 500;
    t.y = 500;
    t.z = 500;
    t.braceleft = 334;
    t.bar = 260;
    t.braceright = 334;
    t.asciitilde = 584;
    t.exclamdown = 333;
    t.cent = 556;
    t.sterling = 556;
    t.fraction = 167;
    t.yen = 556;
    t.florin = 556;
    t.section = 556;
    t.currency = 556;
    t.quotesingle = 191;
    t.quotedblleft = 333;
    t.guillemotleft = 556;
    t.guilsinglleft = 333;
    t.guilsinglright = 333;
    t.fi = 500;
    t.fl = 500;
    t.endash = 556;
    t.dagger = 556;
    t.daggerdbl = 556;
    t.periodcentered = 278;
    t.paragraph = 537;
    t.bullet = 350;
    t.quotesinglbase = 222;
    t.quotedblbase = 333;
    t.quotedblright = 333;
    t.guillemotright = 556;
    t.ellipsis = 1000;
    t.perthousand = 1000;
    t.questiondown = 611;
    t.grave = 333;
    t.acute = 333;
    t.circumflex = 333;
    t.tilde = 333;
    t.macron = 333;
    t.breve = 333;
    t.dotaccent = 333;
    t.dieresis = 333;
    t.ring = 333;
    t.cedilla = 333;
    t.hungarumlaut = 333;
    t.ogonek = 333;
    t.caron = 333;
    t.emdash = 1000;
    t.AE = 1000;
    t.ordfeminine = 370;
    t.Lslash = 556;
    t.Oslash = 778;
    t.OE = 1000;
    t.ordmasculine = 365;
    t.ae = 889;
    t.dotlessi = 278;
    t.lslash = 222;
    t.oslash = 611;
    t.oe = 944;
    t.germandbls = 611;
    t.Idieresis = 278;
    t.eacute = 556;
    t.abreve = 556;
    t.uhungarumlaut = 556;
    t.ecaron = 556;
    t.Ydieresis = 667;
    t.divide = 584;
    t.Yacute = 667;
    t.Acircumflex = 667;
    t.aacute = 556;
    t.Ucircumflex = 722;
    t.yacute = 500;
    t.scommaaccent = 500;
    t.ecircumflex = 556;
    t.Uring = 722;
    t.Udieresis = 722;
    t.aogonek = 556;
    t.Uacute = 722;
    t.uogonek = 556;
    t.Edieresis = 667;
    t.Dcroat = 722;
    t.commaaccent = 250;
    t.copyright = 737;
    t.Emacron = 667;
    t.ccaron = 500;
    t.aring = 556;
    t.Ncommaaccent = 722;
    t.lacute = 222;
    t.agrave = 556;
    t.Tcommaaccent = 611;
    t.Cacute = 722;
    t.atilde = 556;
    t.Edotaccent = 667;
    t.scaron = 500;
    t.scedilla = 500;
    t.iacute = 278;
    t.lozenge = 471;
    t.Rcaron = 722;
    t.Gcommaaccent = 778;
    t.ucircumflex = 556;
    t.acircumflex = 556;
    t.Amacron = 667;
    t.rcaron = 333;
    t.ccedilla = 500;
    t.Zdotaccent = 611;
    t.Thorn = 667;
    t.Omacron = 778;
    t.Racute = 722;
    t.Sacute = 667;
    t.dcaron = 643;
    t.Umacron = 722;
    t.uring = 556;
    t.threesuperior = 333;
    t.Ograve = 778;
    t.Agrave = 667;
    t.Abreve = 667;
    t.multiply = 584;
    t.uacute = 556;
    t.Tcaron = 611;
    t.partialdiff = 476;
    t.ydieresis = 500;
    t.Nacute = 722;
    t.icircumflex = 278;
    t.Ecircumflex = 667;
    t.adieresis = 556;
    t.edieresis = 556;
    t.cacute = 500;
    t.nacute = 556;
    t.umacron = 556;
    t.Ncaron = 722;
    t.Iacute = 278;
    t.plusminus = 584;
    t.brokenbar = 260;
    t.registered = 737;
    t.Gbreve = 778;
    t.Idotaccent = 278;
    t.summation = 600;
    t.Egrave = 667;
    t.racute = 333;
    t.omacron = 556;
    t.Zacute = 611;
    t.Zcaron = 611;
    t.greaterequal = 549;
    t.Eth = 722;
    t.Ccedilla = 722;
    t.lcommaaccent = 222;
    t.tcaron = 317;
    t.eogonek = 556;
    t.Uogonek = 722;
    t.Aacute = 667;
    t.Adieresis = 667;
    t.egrave = 556;
    t.zacute = 500;
    t.iogonek = 222;
    t.Oacute = 778;
    t.oacute = 556;
    t.amacron = 556;
    t.sacute = 500;
    t.idieresis = 278;
    t.Ocircumflex = 778;
    t.Ugrave = 722;
    t.Delta = 612;
    t.thorn = 556;
    t.twosuperior = 333;
    t.Odieresis = 778;
    t.mu = 556;
    t.igrave = 278;
    t.ohungarumlaut = 556;
    t.Eogonek = 667;
    t.dcroat = 556;
    t.threequarters = 834;
    t.Scedilla = 667;
    t.lcaron = 299;
    t.Kcommaaccent = 667;
    t.Lacute = 556;
    t.trademark = 1000;
    t.edotaccent = 556;
    t.Igrave = 278;
    t.Imacron = 278;
    t.Lcaron = 556;
    t.onehalf = 834;
    t.lessequal = 549;
    t.ocircumflex = 556;
    t.ntilde = 556;
    t.Uhungarumlaut = 722;
    t.Eacute = 667;
    t.emacron = 556;
    t.gbreve = 556;
    t.onequarter = 834;
    t.Scaron = 667;
    t.Scommaaccent = 667;
    t.Ohungarumlaut = 778;
    t.degree = 400;
    t.ograve = 556;
    t.Ccaron = 722;
    t.ugrave = 556;
    t.radical = 453;
    t.Dcaron = 722;
    t.rcommaaccent = 333;
    t.Ntilde = 722;
    t.otilde = 556;
    t.Rcommaaccent = 722;
    t.Lcommaaccent = 556;
    t.Atilde = 667;
    t.Aogonek = 667;
    t.Aring = 667;
    t.Otilde = 778;
    t.zdotaccent = 500;
    t.Ecaron = 667;
    t.Iogonek = 278;
    t.kcommaaccent = 500;
    t.minus = 584;
    t.Icircumflex = 278;
    t.ncaron = 556;
    t.tcommaaccent = 278;
    t.logicalnot = 584;
    t.odieresis = 556;
    t.udieresis = 556;
    t.notequal = 549;
    t.gcommaaccent = 556;
    t.eth = 556;
    t.zcaron = 500;
    t.ncommaaccent = 556;
    t.onesuperior = 333;
    t.imacron = 278;
    t.Euro = 556;
  });
  t["Helvetica-Bold"] = getLookupTableFactory(function (t) {
    t.space = 278;
    t.exclam = 333;
    t.quotedbl = 474;
    t.numbersign = 556;
    t.dollar = 556;
    t.percent = 889;
    t.ampersand = 722;
    t.quoteright = 278;
    t.parenleft = 333;
    t.parenright = 333;
    t.asterisk = 389;
    t.plus = 584;
    t.comma = 278;
    t.hyphen = 333;
    t.period = 278;
    t.slash = 278;
    t.zero = 556;
    t.one = 556;
    t.two = 556;
    t.three = 556;
    t.four = 556;
    t.five = 556;
    t.six = 556;
    t.seven = 556;
    t.eight = 556;
    t.nine = 556;
    t.colon = 333;
    t.semicolon = 333;
    t.less = 584;
    t.equal = 584;
    t.greater = 584;
    t.question = 611;
    t.at = 975;
    t.A = 722;
    t.B = 722;
    t.C = 722;
    t.D = 722;
    t.E = 667;
    t.F = 611;
    t.G = 778;
    t.H = 722;
    t.I = 278;
    t.J = 556;
    t.K = 722;
    t.L = 611;
    t.M = 833;
    t.N = 722;
    t.O = 778;
    t.P = 667;
    t.Q = 778;
    t.R = 722;
    t.S = 667;
    t.T = 611;
    t.U = 722;
    t.V = 667;
    t.W = 944;
    t.X = 667;
    t.Y = 667;
    t.Z = 611;
    t.bracketleft = 333;
    t.backslash = 278;
    t.bracketright = 333;
    t.asciicircum = 584;
    t.underscore = 556;
    t.quoteleft = 278;
    t.a = 556;
    t.b = 611;
    t.c = 556;
    t.d = 611;
    t.e = 556;
    t.f = 333;
    t.g = 611;
    t.h = 611;
    t.i = 278;
    t.j = 278;
    t.k = 556;
    t.l = 278;
    t.m = 889;
    t.n = 611;
    t.o = 611;
    t.p = 611;
    t.q = 611;
    t.r = 389;
    t.s = 556;
    t.t = 333;
    t.u = 611;
    t.v = 556;
    t.w = 778;
    t.x = 556;
    t.y = 556;
    t.z = 500;
    t.braceleft = 389;
    t.bar = 280;
    t.braceright = 389;
    t.asciitilde = 584;
    t.exclamdown = 333;
    t.cent = 556;
    t.sterling = 556;
    t.fraction = 167;
    t.yen = 556;
    t.florin = 556;
    t.section = 556;
    t.currency = 556;
    t.quotesingle = 238;
    t.quotedblleft = 500;
    t.guillemotleft = 556;
    t.guilsinglleft = 333;
    t.guilsinglright = 333;
    t.fi = 611;
    t.fl = 611;
    t.endash = 556;
    t.dagger = 556;
    t.daggerdbl = 556;
    t.periodcentered = 278;
    t.paragraph = 556;
    t.bullet = 350;
    t.quotesinglbase = 278;
    t.quotedblbase = 500;
    t.quotedblright = 500;
    t.guillemotright = 556;
    t.ellipsis = 1000;
    t.perthousand = 1000;
    t.questiondown = 611;
    t.grave = 333;
    t.acute = 333;
    t.circumflex = 333;
    t.tilde = 333;
    t.macron = 333;
    t.breve = 333;
    t.dotaccent = 333;
    t.dieresis = 333;
    t.ring = 333;
    t.cedilla = 333;
    t.hungarumlaut = 333;
    t.ogonek = 333;
    t.caron = 333;
    t.emdash = 1000;
    t.AE = 1000;
    t.ordfeminine = 370;
    t.Lslash = 611;
    t.Oslash = 778;
    t.OE = 1000;
    t.ordmasculine = 365;
    t.ae = 889;
    t.dotlessi = 278;
    t.lslash = 278;
    t.oslash = 611;
    t.oe = 944;
    t.germandbls = 611;
    t.Idieresis = 278;
    t.eacute = 556;
    t.abreve = 556;
    t.uhungarumlaut = 611;
    t.ecaron = 556;
    t.Ydieresis = 667;
    t.divide = 584;
    t.Yacute = 667;
    t.Acircumflex = 722;
    t.aacute = 556;
    t.Ucircumflex = 722;
    t.yacute = 556;
    t.scommaaccent = 556;
    t.ecircumflex = 556;
    t.Uring = 722;
    t.Udieresis = 722;
    t.aogonek = 556;
    t.Uacute = 722;
    t.uogonek = 611;
    t.Edieresis = 667;
    t.Dcroat = 722;
    t.commaaccent = 250;
    t.copyright = 737;
    t.Emacron = 667;
    t.ccaron = 556;
    t.aring = 556;
    t.Ncommaaccent = 722;
    t.lacute = 278;
    t.agrave = 556;
    t.Tcommaaccent = 611;
    t.Cacute = 722;
    t.atilde = 556;
    t.Edotaccent = 667;
    t.scaron = 556;
    t.scedilla = 556;
    t.iacute = 278;
    t.lozenge = 494;
    t.Rcaron = 722;
    t.Gcommaaccent = 778;
    t.ucircumflex = 611;
    t.acircumflex = 556;
    t.Amacron = 722;
    t.rcaron = 389;
    t.ccedilla = 556;
    t.Zdotaccent = 611;
    t.Thorn = 667;
    t.Omacron = 778;
    t.Racute = 722;
    t.Sacute = 667;
    t.dcaron = 743;
    t.Umacron = 722;
    t.uring = 611;
    t.threesuperior = 333;
    t.Ograve = 778;
    t.Agrave = 722;
    t.Abreve = 722;
    t.multiply = 584;
    t.uacute = 611;
    t.Tcaron = 611;
    t.partialdiff = 494;
    t.ydieresis = 556;
    t.Nacute = 722;
    t.icircumflex = 278;
    t.Ecircumflex = 667;
    t.adieresis = 556;
    t.edieresis = 556;
    t.cacute = 556;
    t.nacute = 611;
    t.umacron = 611;
    t.Ncaron = 722;
    t.Iacute = 278;
    t.plusminus = 584;
    t.brokenbar = 280;
    t.registered = 737;
    t.Gbreve = 778;
    t.Idotaccent = 278;
    t.summation = 600;
    t.Egrave = 667;
    t.racute = 389;
    t.omacron = 611;
    t.Zacute = 611;
    t.Zcaron = 611;
    t.greaterequal = 549;
    t.Eth = 722;
    t.Ccedilla = 722;
    t.lcommaaccent = 278;
    t.tcaron = 389;
    t.eogonek = 556;
    t.Uogonek = 722;
    t.Aacute = 722;
    t.Adieresis = 722;
    t.egrave = 556;
    t.zacute = 500;
    t.iogonek = 278;
    t.Oacute = 778;
    t.oacute = 611;
    t.amacron = 556;
    t.sacute = 556;
    t.idieresis = 278;
    t.Ocircumflex = 778;
    t.Ugrave = 722;
    t.Delta = 612;
    t.thorn = 611;
    t.twosuperior = 333;
    t.Odieresis = 778;
    t.mu = 611;
    t.igrave = 278;
    t.ohungarumlaut = 611;
    t.Eogonek = 667;
    t.dcroat = 611;
    t.threequarters = 834;
    t.Scedilla = 667;
    t.lcaron = 400;
    t.Kcommaaccent = 722;
    t.Lacute = 611;
    t.trademark = 1000;
    t.edotaccent = 556;
    t.Igrave = 278;
    t.Imacron = 278;
    t.Lcaron = 611;
    t.onehalf = 834;
    t.lessequal = 549;
    t.ocircumflex = 611;
    t.ntilde = 611;
    t.Uhungarumlaut = 722;
    t.Eacute = 667;
    t.emacron = 556;
    t.gbreve = 611;
    t.onequarter = 834;
    t.Scaron = 667;
    t.Scommaaccent = 667;
    t.Ohungarumlaut = 778;
    t.degree = 400;
    t.ograve = 611;
    t.Ccaron = 722;
    t.ugrave = 611;
    t.radical = 549;
    t.Dcaron = 722;
    t.rcommaaccent = 389;
    t.Ntilde = 722;
    t.otilde = 611;
    t.Rcommaaccent = 722;
    t.Lcommaaccent = 611;
    t.Atilde = 722;
    t.Aogonek = 722;
    t.Aring = 722;
    t.Otilde = 778;
    t.zdotaccent = 500;
    t.Ecaron = 667;
    t.Iogonek = 278;
    t.kcommaaccent = 556;
    t.minus = 584;
    t.Icircumflex = 278;
    t.ncaron = 611;
    t.tcommaaccent = 333;
    t.logicalnot = 584;
    t.odieresis = 611;
    t.udieresis = 611;
    t.notequal = 549;
    t.gcommaaccent = 611;
    t.eth = 611;
    t.zcaron = 500;
    t.ncommaaccent = 611;
    t.onesuperior = 333;
    t.imacron = 278;
    t.Euro = 556;
  });
  t["Helvetica-BoldOblique"] = getLookupTableFactory(function (t) {
    t.space = 278;
    t.exclam = 333;
    t.quotedbl = 474;
    t.numbersign = 556;
    t.dollar = 556;
    t.percent = 889;
    t.ampersand = 722;
    t.quoteright = 278;
    t.parenleft = 333;
    t.parenright = 333;
    t.asterisk = 389;
    t.plus = 584;
    t.comma = 278;
    t.hyphen = 333;
    t.period = 278;
    t.slash = 278;
    t.zero = 556;
    t.one = 556;
    t.two = 556;
    t.three = 556;
    t.four = 556;
    t.five = 556;
    t.six = 556;
    t.seven = 556;
    t.eight = 556;
    t.nine = 556;
    t.colon = 333;
    t.semicolon = 333;
    t.less = 584;
    t.equal = 584;
    t.greater = 584;
    t.question = 611;
    t.at = 975;
    t.A = 722;
    t.B = 722;
    t.C = 722;
    t.D = 722;
    t.E = 667;
    t.F = 611;
    t.G = 778;
    t.H = 722;
    t.I = 278;
    t.J = 556;
    t.K = 722;
    t.L = 611;
    t.M = 833;
    t.N = 722;
    t.O = 778;
    t.P = 667;
    t.Q = 778;
    t.R = 722;
    t.S = 667;
    t.T = 611;
    t.U = 722;
    t.V = 667;
    t.W = 944;
    t.X = 667;
    t.Y = 667;
    t.Z = 611;
    t.bracketleft = 333;
    t.backslash = 278;
    t.bracketright = 333;
    t.asciicircum = 584;
    t.underscore = 556;
    t.quoteleft = 278;
    t.a = 556;
    t.b = 611;
    t.c = 556;
    t.d = 611;
    t.e = 556;
    t.f = 333;
    t.g = 611;
    t.h = 611;
    t.i = 278;
    t.j = 278;
    t.k = 556;
    t.l = 278;
    t.m = 889;
    t.n = 611;
    t.o = 611;
    t.p = 611;
    t.q = 611;
    t.r = 389;
    t.s = 556;
    t.t = 333;
    t.u = 611;
    t.v = 556;
    t.w = 778;
    t.x = 556;
    t.y = 556;
    t.z = 500;
    t.braceleft = 389;
    t.bar = 280;
    t.braceright = 389;
    t.asciitilde = 584;
    t.exclamdown = 333;
    t.cent = 556;
    t.sterling = 556;
    t.fraction = 167;
    t.yen = 556;
    t.florin = 556;
    t.section = 556;
    t.currency = 556;
    t.quotesingle = 238;
    t.quotedblleft = 500;
    t.guillemotleft = 556;
    t.guilsinglleft = 333;
    t.guilsinglright = 333;
    t.fi = 611;
    t.fl = 611;
    t.endash = 556;
    t.dagger = 556;
    t.daggerdbl = 556;
    t.periodcentered = 278;
    t.paragraph = 556;
    t.bullet = 350;
    t.quotesinglbase = 278;
    t.quotedblbase = 500;
    t.quotedblright = 500;
    t.guillemotright = 556;
    t.ellipsis = 1000;
    t.perthousand = 1000;
    t.questiondown = 611;
    t.grave = 333;
    t.acute = 333;
    t.circumflex = 333;
    t.tilde = 333;
    t.macron = 333;
    t.breve = 333;
    t.dotaccent = 333;
    t.dieresis = 333;
    t.ring = 333;
    t.cedilla = 333;
    t.hungarumlaut = 333;
    t.ogonek = 333;
    t.caron = 333;
    t.emdash = 1000;
    t.AE = 1000;
    t.ordfeminine = 370;
    t.Lslash = 611;
    t.Oslash = 778;
    t.OE = 1000;
    t.ordmasculine = 365;
    t.ae = 889;
    t.dotlessi = 278;
    t.lslash = 278;
    t.oslash = 611;
    t.oe = 944;
    t.germandbls = 611;
    t.Idieresis = 278;
    t.eacute = 556;
    t.abreve = 556;
    t.uhungarumlaut = 611;
    t.ecaron = 556;
    t.Ydieresis = 667;
    t.divide = 584;
    t.Yacute = 667;
    t.Acircumflex = 722;
    t.aacute = 556;
    t.Ucircumflex = 722;
    t.yacute = 556;
    t.scommaaccent = 556;
    t.ecircumflex = 556;
    t.Uring = 722;
    t.Udieresis = 722;
    t.aogonek = 556;
    t.Uacute = 722;
    t.uogonek = 611;
    t.Edieresis = 667;
    t.Dcroat = 722;
    t.commaaccent = 250;
    t.copyright = 737;
    t.Emacron = 667;
    t.ccaron = 556;
    t.aring = 556;
    t.Ncommaaccent = 722;
    t.lacute = 278;
    t.agrave = 556;
    t.Tcommaaccent = 611;
    t.Cacute = 722;
    t.atilde = 556;
    t.Edotaccent = 667;
    t.scaron = 556;
    t.scedilla = 556;
    t.iacute = 278;
    t.lozenge = 494;
    t.Rcaron = 722;
    t.Gcommaaccent = 778;
    t.ucircumflex = 611;
    t.acircumflex = 556;
    t.Amacron = 722;
    t.rcaron = 389;
    t.ccedilla = 556;
    t.Zdotaccent = 611;
    t.Thorn = 667;
    t.Omacron = 778;
    t.Racute = 722;
    t.Sacute = 667;
    t.dcaron = 743;
    t.Umacron = 722;
    t.uring = 611;
    t.threesuperior = 333;
    t.Ograve = 778;
    t.Agrave = 722;
    t.Abreve = 722;
    t.multiply = 584;
    t.uacute = 611;
    t.Tcaron = 611;
    t.partialdiff = 494;
    t.ydieresis = 556;
    t.Nacute = 722;
    t.icircumflex = 278;
    t.Ecircumflex = 667;
    t.adieresis = 556;
    t.edieresis = 556;
    t.cacute = 556;
    t.nacute = 611;
    t.umacron = 611;
    t.Ncaron = 722;
    t.Iacute = 278;
    t.plusminus = 584;
    t.brokenbar = 280;
    t.registered = 737;
    t.Gbreve = 778;
    t.Idotaccent = 278;
    t.summation = 600;
    t.Egrave = 667;
    t.racute = 389;
    t.omacron = 611;
    t.Zacute = 611;
    t.Zcaron = 611;
    t.greaterequal = 549;
    t.Eth = 722;
    t.Ccedilla = 722;
    t.lcommaaccent = 278;
    t.tcaron = 389;
    t.eogonek = 556;
    t.Uogonek = 722;
    t.Aacute = 722;
    t.Adieresis = 722;
    t.egrave = 556;
    t.zacute = 500;
    t.iogonek = 278;
    t.Oacute = 778;
    t.oacute = 611;
    t.amacron = 556;
    t.sacute = 556;
    t.idieresis = 278;
    t.Ocircumflex = 778;
    t.Ugrave = 722;
    t.Delta = 612;
    t.thorn = 611;
    t.twosuperior = 333;
    t.Odieresis = 778;
    t.mu = 611;
    t.igrave = 278;
    t.ohungarumlaut = 611;
    t.Eogonek = 667;
    t.dcroat = 611;
    t.threequarters = 834;
    t.Scedilla = 667;
    t.lcaron = 400;
    t.Kcommaaccent = 722;
    t.Lacute = 611;
    t.trademark = 1000;
    t.edotaccent = 556;
    t.Igrave = 278;
    t.Imacron = 278;
    t.Lcaron = 611;
    t.onehalf = 834;
    t.lessequal = 549;
    t.ocircumflex = 611;
    t.ntilde = 611;
    t.Uhungarumlaut = 722;
    t.Eacute = 667;
    t.emacron = 556;
    t.gbreve = 611;
    t.onequarter = 834;
    t.Scaron = 667;
    t.Scommaaccent = 667;
    t.Ohungarumlaut = 778;
    t.degree = 400;
    t.ograve = 611;
    t.Ccaron = 722;
    t.ugrave = 611;
    t.radical = 549;
    t.Dcaron = 722;
    t.rcommaaccent = 389;
    t.Ntilde = 722;
    t.otilde = 611;
    t.Rcommaaccent = 722;
    t.Lcommaaccent = 611;
    t.Atilde = 722;
    t.Aogonek = 722;
    t.Aring = 722;
    t.Otilde = 778;
    t.zdotaccent = 500;
    t.Ecaron = 667;
    t.Iogonek = 278;
    t.kcommaaccent = 556;
    t.minus = 584;
    t.Icircumflex = 278;
    t.ncaron = 611;
    t.tcommaaccent = 333;
    t.logicalnot = 584;
    t.odieresis = 611;
    t.udieresis = 611;
    t.notequal = 549;
    t.gcommaaccent = 611;
    t.eth = 611;
    t.zcaron = 500;
    t.ncommaaccent = 611;
    t.onesuperior = 333;
    t.imacron = 278;
    t.Euro = 556;
  });
  t["Helvetica-Oblique"] = getLookupTableFactory(function (t) {
    t.space = 278;
    t.exclam = 278;
    t.quotedbl = 355;
    t.numbersign = 556;
    t.dollar = 556;
    t.percent = 889;
    t.ampersand = 667;
    t.quoteright = 222;
    t.parenleft = 333;
    t.parenright = 333;
    t.asterisk = 389;
    t.plus = 584;
    t.comma = 278;
    t.hyphen = 333;
    t.period = 278;
    t.slash = 278;
    t.zero = 556;
    t.one = 556;
    t.two = 556;
    t.three = 556;
    t.four = 556;
    t.five = 556;
    t.six = 556;
    t.seven = 556;
    t.eight = 556;
    t.nine = 556;
    t.colon = 278;
    t.semicolon = 278;
    t.less = 584;
    t.equal = 584;
    t.greater = 584;
    t.question = 556;
    t.at = 1015;
    t.A = 667;
    t.B = 667;
    t.C = 722;
    t.D = 722;
    t.E = 667;
    t.F = 611;
    t.G = 778;
    t.H = 722;
    t.I = 278;
    t.J = 500;
    t.K = 667;
    t.L = 556;
    t.M = 833;
    t.N = 722;
    t.O = 778;
    t.P = 667;
    t.Q = 778;
    t.R = 722;
    t.S = 667;
    t.T = 611;
    t.U = 722;
    t.V = 667;
    t.W = 944;
    t.X = 667;
    t.Y = 667;
    t.Z = 611;
    t.bracketleft = 278;
    t.backslash = 278;
    t.bracketright = 278;
    t.asciicircum = 469;
    t.underscore = 556;
    t.quoteleft = 222;
    t.a = 556;
    t.b = 556;
    t.c = 500;
    t.d = 556;
    t.e = 556;
    t.f = 278;
    t.g = 556;
    t.h = 556;
    t.i = 222;
    t.j = 222;
    t.k = 500;
    t.l = 222;
    t.m = 833;
    t.n = 556;
    t.o = 556;
    t.p = 556;
    t.q = 556;
    t.r = 333;
    t.s = 500;
    t.t = 278;
    t.u = 556;
    t.v = 500;
    t.w = 722;
    t.x = 500;
    t.y = 500;
    t.z = 500;
    t.braceleft = 334;
    t.bar = 260;
    t.braceright = 334;
    t.asciitilde = 584;
    t.exclamdown = 333;
    t.cent = 556;
    t.sterling = 556;
    t.fraction = 167;
    t.yen = 556;
    t.florin = 556;
    t.section = 556;
    t.currency = 556;
    t.quotesingle = 191;
    t.quotedblleft = 333;
    t.guillemotleft = 556;
    t.guilsinglleft = 333;
    t.guilsinglright = 333;
    t.fi = 500;
    t.fl = 500;
    t.endash = 556;
    t.dagger = 556;
    t.daggerdbl = 556;
    t.periodcentered = 278;
    t.paragraph = 537;
    t.bullet = 350;
    t.quotesinglbase = 222;
    t.quotedblbase = 333;
    t.quotedblright = 333;
    t.guillemotright = 556;
    t.ellipsis = 1000;
    t.perthousand = 1000;
    t.questiondown = 611;
    t.grave = 333;
    t.acute = 333;
    t.circumflex = 333;
    t.tilde = 333;
    t.macron = 333;
    t.breve = 333;
    t.dotaccent = 333;
    t.dieresis = 333;
    t.ring = 333;
    t.cedilla = 333;
    t.hungarumlaut = 333;
    t.ogonek = 333;
    t.caron = 333;
    t.emdash = 1000;
    t.AE = 1000;
    t.ordfeminine = 370;
    t.Lslash = 556;
    t.Oslash = 778;
    t.OE = 1000;
    t.ordmasculine = 365;
    t.ae = 889;
    t.dotlessi = 278;
    t.lslash = 222;
    t.oslash = 611;
    t.oe = 944;
    t.germandbls = 611;
    t.Idieresis = 278;
    t.eacute = 556;
    t.abreve = 556;
    t.uhungarumlaut = 556;
    t.ecaron = 556;
    t.Ydieresis = 667;
    t.divide = 584;
    t.Yacute = 667;
    t.Acircumflex = 667;
    t.aacute = 556;
    t.Ucircumflex = 722;
    t.yacute = 500;
    t.scommaaccent = 500;
    t.ecircumflex = 556;
    t.Uring = 722;
    t.Udieresis = 722;
    t.aogonek = 556;
    t.Uacute = 722;
    t.uogonek = 556;
    t.Edieresis = 667;
    t.Dcroat = 722;
    t.commaaccent = 250;
    t.copyright = 737;
    t.Emacron = 667;
    t.ccaron = 500;
    t.aring = 556;
    t.Ncommaaccent = 722;
    t.lacute = 222;
    t.agrave = 556;
    t.Tcommaaccent = 611;
    t.Cacute = 722;
    t.atilde = 556;
    t.Edotaccent = 667;
    t.scaron = 500;
    t.scedilla = 500;
    t.iacute = 278;
    t.lozenge = 471;
    t.Rcaron = 722;
    t.Gcommaaccent = 778;
    t.ucircumflex = 556;
    t.acircumflex = 556;
    t.Amacron = 667;
    t.rcaron = 333;
    t.ccedilla = 500;
    t.Zdotaccent = 611;
    t.Thorn = 667;
    t.Omacron = 778;
    t.Racute = 722;
    t.Sacute = 667;
    t.dcaron = 643;
    t.Umacron = 722;
    t.uring = 556;
    t.threesuperior = 333;
    t.Ograve = 778;
    t.Agrave = 667;
    t.Abreve = 667;
    t.multiply = 584;
    t.uacute = 556;
    t.Tcaron = 611;
    t.partialdiff = 476;
    t.ydieresis = 500;
    t.Nacute = 722;
    t.icircumflex = 278;
    t.Ecircumflex = 667;
    t.adieresis = 556;
    t.edieresis = 556;
    t.cacute = 500;
    t.nacute = 556;
    t.umacron = 556;
    t.Ncaron = 722;
    t.Iacute = 278;
    t.plusminus = 584;
    t.brokenbar = 260;
    t.registered = 737;
    t.Gbreve = 778;
    t.Idotaccent = 278;
    t.summation = 600;
    t.Egrave = 667;
    t.racute = 333;
    t.omacron = 556;
    t.Zacute = 611;
    t.Zcaron = 611;
    t.greaterequal = 549;
    t.Eth = 722;
    t.Ccedilla = 722;
    t.lcommaaccent = 222;
    t.tcaron = 317;
    t.eogonek = 556;
    t.Uogonek = 722;
    t.Aacute = 667;
    t.Adieresis = 667;
    t.egrave = 556;
    t.zacute = 500;
    t.iogonek = 222;
    t.Oacute = 778;
    t.oacute = 556;
    t.amacron = 556;
    t.sacute = 500;
    t.idieresis = 278;
    t.Ocircumflex = 778;
    t.Ugrave = 722;
    t.Delta = 612;
    t.thorn = 556;
    t.twosuperior = 333;
    t.Odieresis = 778;
    t.mu = 556;
    t.igrave = 278;
    t.ohungarumlaut = 556;
    t.Eogonek = 667;
    t.dcroat = 556;
    t.threequarters = 834;
    t.Scedilla = 667;
    t.lcaron = 299;
    t.Kcommaaccent = 667;
    t.Lacute = 556;
    t.trademark = 1000;
    t.edotaccent = 556;
    t.Igrave = 278;
    t.Imacron = 278;
    t.Lcaron = 556;
    t.onehalf = 834;
    t.lessequal = 549;
    t.ocircumflex = 556;
    t.ntilde = 556;
    t.Uhungarumlaut = 722;
    t.Eacute = 667;
    t.emacron = 556;
    t.gbreve = 556;
    t.onequarter = 834;
    t.Scaron = 667;
    t.Scommaaccent = 667;
    t.Ohungarumlaut = 778;
    t.degree = 400;
    t.ograve = 556;
    t.Ccaron = 722;
    t.ugrave = 556;
    t.radical = 453;
    t.Dcaron = 722;
    t.rcommaaccent = 333;
    t.Ntilde = 722;
    t.otilde = 556;
    t.Rcommaaccent = 722;
    t.Lcommaaccent = 556;
    t.Atilde = 667;
    t.Aogonek = 667;
    t.Aring = 667;
    t.Otilde = 778;
    t.zdotaccent = 500;
    t.Ecaron = 667;
    t.Iogonek = 278;
    t.kcommaaccent = 500;
    t.minus = 584;
    t.Icircumflex = 278;
    t.ncaron = 556;
    t.tcommaaccent = 278;
    t.logicalnot = 584;
    t.odieresis = 556;
    t.udieresis = 556;
    t.notequal = 549;
    t.gcommaaccent = 556;
    t.eth = 556;
    t.zcaron = 500;
    t.ncommaaccent = 556;
    t.onesuperior = 333;
    t.imacron = 278;
    t.Euro = 556;
  });
  t.Symbol = getLookupTableFactory(function (t) {
    t.space = 250;
    t.exclam = 333;
    t.universal = 713;
    t.numbersign = 500;
    t.existential = 549;
    t.percent = 833;
    t.ampersand = 778;
    t.suchthat = 439;
    t.parenleft = 333;
    t.parenright = 333;
    t.asteriskmath = 500;
    t.plus = 549;
    t.comma = 250;
    t.minus = 549;
    t.period = 250;
    t.slash = 278;
    t.zero = 500;
    t.one = 500;
    t.two = 500;
    t.three = 500;
    t.four = 500;
    t.five = 500;
    t.six = 500;
    t.seven = 500;
    t.eight = 500;
    t.nine = 500;
    t.colon = 278;
    t.semicolon = 278;
    t.less = 549;
    t.equal = 549;
    t.greater = 549;
    t.question = 444;
    t.congruent = 549;
    t.Alpha = 722;
    t.Beta = 667;
    t.Chi = 722;
    t.Delta = 612;
    t.Epsilon = 611;
    t.Phi = 763;
    t.Gamma = 603;
    t.Eta = 722;
    t.Iota = 333;
    t.theta1 = 631;
    t.Kappa = 722;
    t.Lambda = 686;
    t.Mu = 889;
    t.Nu = 722;
    t.Omicron = 722;
    t.Pi = 768;
    t.Theta = 741;
    t.Rho = 556;
    t.Sigma = 592;
    t.Tau = 611;
    t.Upsilon = 690;
    t.sigma1 = 439;
    t.Omega = 768;
    t.Xi = 645;
    t.Psi = 795;
    t.Zeta = 611;
    t.bracketleft = 333;
    t.therefore = 863;
    t.bracketright = 333;
    t.perpendicular = 658;
    t.underscore = 500;
    t.radicalex = 500;
    t.alpha = 631;
    t.beta = 549;
    t.chi = 549;
    t.delta = 494;
    t.epsilon = 439;
    t.phi = 521;
    t.gamma = 411;
    t.eta = 603;
    t.iota = 329;
    t.phi1 = 603;
    t.kappa = 549;
    t.lambda = 549;
    t.mu = 576;
    t.nu = 521;
    t.omicron = 549;
    t.pi = 549;
    t.theta = 521;
    t.rho = 549;
    t.sigma = 603;
    t.tau = 439;
    t.upsilon = 576;
    t.omega1 = 713;
    t.omega = 686;
    t.xi = 493;
    t.psi = 686;
    t.zeta = 494;
    t.braceleft = 480;
    t.bar = 200;
    t.braceright = 480;
    t.similar = 549;
    t.Euro = 750;
    t.Upsilon1 = 620;
    t.minute = 247;
    t.lessequal = 549;
    t.fraction = 167;
    t.infinity = 713;
    t.florin = 500;
    t.club = 753;
    t.diamond = 753;
    t.heart = 753;
    t.spade = 753;
    t.arrowboth = 1042;
    t.arrowleft = 987;
    t.arrowup = 603;
    t.arrowright = 987;
    t.arrowdown = 603;
    t.degree = 400;
    t.plusminus = 549;
    t.second = 411;
    t.greaterequal = 549;
    t.multiply = 549;
    t.proportional = 713;
    t.partialdiff = 494;
    t.bullet = 460;
    t.divide = 549;
    t.notequal = 549;
    t.equivalence = 549;
    t.approxequal = 549;
    t.ellipsis = 1000;
    t.arrowvertex = 603;
    t.arrowhorizex = 1000;
    t.carriagereturn = 658;
    t.aleph = 823;
    t.Ifraktur = 686;
    t.Rfraktur = 795;
    t.weierstrass = 987;
    t.circlemultiply = 768;
    t.circleplus = 768;
    t.emptyset = 823;
    t.intersection = 768;
    t.union = 768;
    t.propersuperset = 713;
    t.reflexsuperset = 713;
    t.notsubset = 713;
    t.propersubset = 713;
    t.reflexsubset = 713;
    t.element = 713;
    t.notelement = 713;
    t.angle = 768;
    t.gradient = 713;
    t.registerserif = 790;
    t.copyrightserif = 790;
    t.trademarkserif = 890;
    t.product = 823;
    t.radical = 549;
    t.dotmath = 250;
    t.logicalnot = 713;
    t.logicaland = 603;
    t.logicalor = 603;
    t.arrowdblboth = 1042;
    t.arrowdblleft = 987;
    t.arrowdblup = 603;
    t.arrowdblright = 987;
    t.arrowdbldown = 603;
    t.lozenge = 494;
    t.angleleft = 329;
    t.registersans = 790;
    t.copyrightsans = 790;
    t.trademarksans = 786;
    t.summation = 713;
    t.parenlefttp = 384;
    t.parenleftex = 384;
    t.parenleftbt = 384;
    t.bracketlefttp = 384;
    t.bracketleftex = 384;
    t.bracketleftbt = 384;
    t.bracelefttp = 494;
    t.braceleftmid = 494;
    t.braceleftbt = 494;
    t.braceex = 494;
    t.angleright = 329;
    t.integral = 274;
    t.integraltp = 686;
    t.integralex = 686;
    t.integralbt = 686;
    t.parenrighttp = 384;
    t.parenrightex = 384;
    t.parenrightbt = 384;
    t.bracketrighttp = 384;
    t.bracketrightex = 384;
    t.bracketrightbt = 384;
    t.bracerighttp = 494;
    t.bracerightmid = 494;
    t.bracerightbt = 494;
    t.apple = 790;
  });
  t["Times-Roman"] = getLookupTableFactory(function (t) {
    t.space = 250;
    t.exclam = 333;
    t.quotedbl = 408;
    t.numbersign = 500;
    t.dollar = 500;
    t.percent = 833;
    t.ampersand = 778;
    t.quoteright = 333;
    t.parenleft = 333;
    t.parenright = 333;
    t.asterisk = 500;
    t.plus = 564;
    t.comma = 250;
    t.hyphen = 333;
    t.period = 250;
    t.slash = 278;
    t.zero = 500;
    t.one = 500;
    t.two = 500;
    t.three = 500;
    t.four = 500;
    t.five = 500;
    t.six = 500;
    t.seven = 500;
    t.eight = 500;
    t.nine = 500;
    t.colon = 278;
    t.semicolon = 278;
    t.less = 564;
    t.equal = 564;
    t.greater = 564;
    t.question = 444;
    t.at = 921;
    t.A = 722;
    t.B = 667;
    t.C = 667;
    t.D = 722;
    t.E = 611;
    t.F = 556;
    t.G = 722;
    t.H = 722;
    t.I = 333;
    t.J = 389;
    t.K = 722;
    t.L = 611;
    t.M = 889;
    t.N = 722;
    t.O = 722;
    t.P = 556;
    t.Q = 722;
    t.R = 667;
    t.S = 556;
    t.T = 611;
    t.U = 722;
    t.V = 722;
    t.W = 944;
    t.X = 722;
    t.Y = 722;
    t.Z = 611;
    t.bracketleft = 333;
    t.backslash = 278;
    t.bracketright = 333;
    t.asciicircum = 469;
    t.underscore = 500;
    t.quoteleft = 333;
    t.a = 444;
    t.b = 500;
    t.c = 444;
    t.d = 500;
    t.e = 444;
    t.f = 333;
    t.g = 500;
    t.h = 500;
    t.i = 278;
    t.j = 278;
    t.k = 500;
    t.l = 278;
    t.m = 778;
    t.n = 500;
    t.o = 500;
    t.p = 500;
    t.q = 500;
    t.r = 333;
    t.s = 389;
    t.t = 278;
    t.u = 500;
    t.v = 500;
    t.w = 722;
    t.x = 500;
    t.y = 500;
    t.z = 444;
    t.braceleft = 480;
    t.bar = 200;
    t.braceright = 480;
    t.asciitilde = 541;
    t.exclamdown = 333;
    t.cent = 500;
    t.sterling = 500;
    t.fraction = 167;
    t.yen = 500;
    t.florin = 500;
    t.section = 500;
    t.currency = 500;
    t.quotesingle = 180;
    t.quotedblleft = 444;
    t.guillemotleft = 500;
    t.guilsinglleft = 333;
    t.guilsinglright = 333;
    t.fi = 556;
    t.fl = 556;
    t.endash = 500;
    t.dagger = 500;
    t.daggerdbl = 500;
    t.periodcentered = 250;
    t.paragraph = 453;
    t.bullet = 350;
    t.quotesinglbase = 333;
    t.quotedblbase = 444;
    t.quotedblright = 444;
    t.guillemotright = 500;
    t.ellipsis = 1000;
    t.perthousand = 1000;
    t.questiondown = 444;
    t.grave = 333;
    t.acute = 333;
    t.circumflex = 333;
    t.tilde = 333;
    t.macron = 333;
    t.breve = 333;
    t.dotaccent = 333;
    t.dieresis = 333;
    t.ring = 333;
    t.cedilla = 333;
    t.hungarumlaut = 333;
    t.ogonek = 333;
    t.caron = 333;
    t.emdash = 1000;
    t.AE = 889;
    t.ordfeminine = 276;
    t.Lslash = 611;
    t.Oslash = 722;
    t.OE = 889;
    t.ordmasculine = 310;
    t.ae = 667;
    t.dotlessi = 278;
    t.lslash = 278;
    t.oslash = 500;
    t.oe = 722;
    t.germandbls = 500;
    t.Idieresis = 333;
    t.eacute = 444;
    t.abreve = 444;
    t.uhungarumlaut = 500;
    t.ecaron = 444;
    t.Ydieresis = 722;
    t.divide = 564;
    t.Yacute = 722;
    t.Acircumflex = 722;
    t.aacute = 444;
    t.Ucircumflex = 722;
    t.yacute = 500;
    t.scommaaccent = 389;
    t.ecircumflex = 444;
    t.Uring = 722;
    t.Udieresis = 722;
    t.aogonek = 444;
    t.Uacute = 722;
    t.uogonek = 500;
    t.Edieresis = 611;
    t.Dcroat = 722;
    t.commaaccent = 250;
    t.copyright = 760;
    t.Emacron = 611;
    t.ccaron = 444;
    t.aring = 444;
    t.Ncommaaccent = 722;
    t.lacute = 278;
    t.agrave = 444;
    t.Tcommaaccent = 611;
    t.Cacute = 667;
    t.atilde = 444;
    t.Edotaccent = 611;
    t.scaron = 389;
    t.scedilla = 389;
    t.iacute = 278;
    t.lozenge = 471;
    t.Rcaron = 667;
    t.Gcommaaccent = 722;
    t.ucircumflex = 500;
    t.acircumflex = 444;
    t.Amacron = 722;
    t.rcaron = 333;
    t.ccedilla = 444;
    t.Zdotaccent = 611;
    t.Thorn = 556;
    t.Omacron = 722;
    t.Racute = 667;
    t.Sacute = 556;
    t.dcaron = 588;
    t.Umacron = 722;
    t.uring = 500;
    t.threesuperior = 300;
    t.Ograve = 722;
    t.Agrave = 722;
    t.Abreve = 722;
    t.multiply = 564;
    t.uacute = 500;
    t.Tcaron = 611;
    t.partialdiff = 476;
    t.ydieresis = 500;
    t.Nacute = 722;
    t.icircumflex = 278;
    t.Ecircumflex = 611;
    t.adieresis = 444;
    t.edieresis = 444;
    t.cacute = 444;
    t.nacute = 500;
    t.umacron = 500;
    t.Ncaron = 722;
    t.Iacute = 333;
    t.plusminus = 564;
    t.brokenbar = 200;
    t.registered = 760;
    t.Gbreve = 722;
    t.Idotaccent = 333;
    t.summation = 600;
    t.Egrave = 611;
    t.racute = 333;
    t.omacron = 500;
    t.Zacute = 611;
    t.Zcaron = 611;
    t.greaterequal = 549;
    t.Eth = 722;
    t.Ccedilla = 667;
    t.lcommaaccent = 278;
    t.tcaron = 326;
    t.eogonek = 444;
    t.Uogonek = 722;
    t.Aacute = 722;
    t.Adieresis = 722;
    t.egrave = 444;
    t.zacute = 444;
    t.iogonek = 278;
    t.Oacute = 722;
    t.oacute = 500;
    t.amacron = 444;
    t.sacute = 389;
    t.idieresis = 278;
    t.Ocircumflex = 722;
    t.Ugrave = 722;
    t.Delta = 612;
    t.thorn = 500;
    t.twosuperior = 300;
    t.Odieresis = 722;
    t.mu = 500;
    t.igrave = 278;
    t.ohungarumlaut = 500;
    t.Eogonek = 611;
    t.dcroat = 500;
    t.threequarters = 750;
    t.Scedilla = 556;
    t.lcaron = 344;
    t.Kcommaaccent = 722;
    t.Lacute = 611;
    t.trademark = 980;
    t.edotaccent = 444;
    t.Igrave = 333;
    t.Imacron = 333;
    t.Lcaron = 611;
    t.onehalf = 750;
    t.lessequal = 549;
    t.ocircumflex = 500;
    t.ntilde = 500;
    t.Uhungarumlaut = 722;
    t.Eacute = 611;
    t.emacron = 444;
    t.gbreve = 500;
    t.onequarter = 750;
    t.Scaron = 556;
    t.Scommaaccent = 556;
    t.Ohungarumlaut = 722;
    t.degree = 400;
    t.ograve = 500;
    t.Ccaron = 667;
    t.ugrave = 500;
    t.radical = 453;
    t.Dcaron = 722;
    t.rcommaaccent = 333;
    t.Ntilde = 722;
    t.otilde = 500;
    t.Rcommaaccent = 667;
    t.Lcommaaccent = 611;
    t.Atilde = 722;
    t.Aogonek = 722;
    t.Aring = 722;
    t.Otilde = 722;
    t.zdotaccent = 444;
    t.Ecaron = 611;
    t.Iogonek = 333;
    t.kcommaaccent = 500;
    t.minus = 564;
    t.Icircumflex = 333;
    t.ncaron = 500;
    t.tcommaaccent = 278;
    t.logicalnot = 564;
    t.odieresis = 500;
    t.udieresis = 500;
    t.notequal = 549;
    t.gcommaaccent = 500;
    t.eth = 500;
    t.zcaron = 444;
    t.ncommaaccent = 500;
    t.onesuperior = 300;
    t.imacron = 278;
    t.Euro = 500;
  });
  t["Times-Bold"] = getLookupTableFactory(function (t) {
    t.space = 250;
    t.exclam = 333;
    t.quotedbl = 555;
    t.numbersign = 500;
    t.dollar = 500;
    t.percent = 1000;
    t.ampersand = 833;
    t.quoteright = 333;
    t.parenleft = 333;
    t.parenright = 333;
    t.asterisk = 500;
    t.plus = 570;
    t.comma = 250;
    t.hyphen = 333;
    t.period = 250;
    t.slash = 278;
    t.zero = 500;
    t.one = 500;
    t.two = 500;
    t.three = 500;
    t.four = 500;
    t.five = 500;
    t.six = 500;
    t.seven = 500;
    t.eight = 500;
    t.nine = 500;
    t.colon = 333;
    t.semicolon = 333;
    t.less = 570;
    t.equal = 570;
    t.greater = 570;
    t.question = 500;
    t.at = 930;
    t.A = 722;
    t.B = 667;
    t.C = 722;
    t.D = 722;
    t.E = 667;
    t.F = 611;
    t.G = 778;
    t.H = 778;
    t.I = 389;
    t.J = 500;
    t.K = 778;
    t.L = 667;
    t.M = 944;
    t.N = 722;
    t.O = 778;
    t.P = 611;
    t.Q = 778;
    t.R = 722;
    t.S = 556;
    t.T = 667;
    t.U = 722;
    t.V = 722;
    t.W = 1000;
    t.X = 722;
    t.Y = 722;
    t.Z = 667;
    t.bracketleft = 333;
    t.backslash = 278;
    t.bracketright = 333;
    t.asciicircum = 581;
    t.underscore = 500;
    t.quoteleft = 333;
    t.a = 500;
    t.b = 556;
    t.c = 444;
    t.d = 556;
    t.e = 444;
    t.f = 333;
    t.g = 500;
    t.h = 556;
    t.i = 278;
    t.j = 333;
    t.k = 556;
    t.l = 278;
    t.m = 833;
    t.n = 556;
    t.o = 500;
    t.p = 556;
    t.q = 556;
    t.r = 444;
    t.s = 389;
    t.t = 333;
    t.u = 556;
    t.v = 500;
    t.w = 722;
    t.x = 500;
    t.y = 500;
    t.z = 444;
    t.braceleft = 394;
    t.bar = 220;
    t.braceright = 394;
    t.asciitilde = 520;
    t.exclamdown = 333;
    t.cent = 500;
    t.sterling = 500;
    t.fraction = 167;
    t.yen = 500;
    t.florin = 500;
    t.section = 500;
    t.currency = 500;
    t.quotesingle = 278;
    t.quotedblleft = 500;
    t.guillemotleft = 500;
    t.guilsinglleft = 333;
    t.guilsinglright = 333;
    t.fi = 556;
    t.fl = 556;
    t.endash = 500;
    t.dagger = 500;
    t.daggerdbl = 500;
    t.periodcentered = 250;
    t.paragraph = 540;
    t.bullet = 350;
    t.quotesinglbase = 333;
    t.quotedblbase = 500;
    t.quotedblright = 500;
    t.guillemotright = 500;
    t.ellipsis = 1000;
    t.perthousand = 1000;
    t.questiondown = 500;
    t.grave = 333;
    t.acute = 333;
    t.circumflex = 333;
    t.tilde = 333;
    t.macron = 333;
    t.breve = 333;
    t.dotaccent = 333;
    t.dieresis = 333;
    t.ring = 333;
    t.cedilla = 333;
    t.hungarumlaut = 333;
    t.ogonek = 333;
    t.caron = 333;
    t.emdash = 1000;
    t.AE = 1000;
    t.ordfeminine = 300;
    t.Lslash = 667;
    t.Oslash = 778;
    t.OE = 1000;
    t.ordmasculine = 330;
    t.ae = 722;
    t.dotlessi = 278;
    t.lslash = 278;
    t.oslash = 500;
    t.oe = 722;
    t.germandbls = 556;
    t.Idieresis = 389;
    t.eacute = 444;
    t.abreve = 500;
    t.uhungarumlaut = 556;
    t.ecaron = 444;
    t.Ydieresis = 722;
    t.divide = 570;
    t.Yacute = 722;
    t.Acircumflex = 722;
    t.aacute = 500;
    t.Ucircumflex = 722;
    t.yacute = 500;
    t.scommaaccent = 389;
    t.ecircumflex = 444;
    t.Uring = 722;
    t.Udieresis = 722;
    t.aogonek = 500;
    t.Uacute = 722;
    t.uogonek = 556;
    t.Edieresis = 667;
    t.Dcroat = 722;
    t.commaaccent = 250;
    t.copyright = 747;
    t.Emacron = 667;
    t.ccaron = 444;
    t.aring = 500;
    t.Ncommaaccent = 722;
    t.lacute = 278;
    t.agrave = 500;
    t.Tcommaaccent = 667;
    t.Cacute = 722;
    t.atilde = 500;
    t.Edotaccent = 667;
    t.scaron = 389;
    t.scedilla = 389;
    t.iacute = 278;
    t.lozenge = 494;
    t.Rcaron = 722;
    t.Gcommaaccent = 778;
    t.ucircumflex = 556;
    t.acircumflex = 500;
    t.Amacron = 722;
    t.rcaron = 444;
    t.ccedilla = 444;
    t.Zdotaccent = 667;
    t.Thorn = 611;
    t.Omacron = 778;
    t.Racute = 722;
    t.Sacute = 556;
    t.dcaron = 672;
    t.Umacron = 722;
    t.uring = 556;
    t.threesuperior = 300;
    t.Ograve = 778;
    t.Agrave = 722;
    t.Abreve = 722;
    t.multiply = 570;
    t.uacute = 556;
    t.Tcaron = 667;
    t.partialdiff = 494;
    t.ydieresis = 500;
    t.Nacute = 722;
    t.icircumflex = 278;
    t.Ecircumflex = 667;
    t.adieresis = 500;
    t.edieresis = 444;
    t.cacute = 444;
    t.nacute = 556;
    t.umacron = 556;
    t.Ncaron = 722;
    t.Iacute = 389;
    t.plusminus = 570;
    t.brokenbar = 220;
    t.registered = 747;
    t.Gbreve = 778;
    t.Idotaccent = 389;
    t.summation = 600;
    t.Egrave = 667;
    t.racute = 444;
    t.omacron = 500;
    t.Zacute = 667;
    t.Zcaron = 667;
    t.greaterequal = 549;
    t.Eth = 722;
    t.Ccedilla = 722;
    t.lcommaaccent = 278;
    t.tcaron = 416;
    t.eogonek = 444;
    t.Uogonek = 722;
    t.Aacute = 722;
    t.Adieresis = 722;
    t.egrave = 444;
    t.zacute = 444;
    t.iogonek = 278;
    t.Oacute = 778;
    t.oacute = 500;
    t.amacron = 500;
    t.sacute = 389;
    t.idieresis = 278;
    t.Ocircumflex = 778;
    t.Ugrave = 722;
    t.Delta = 612;
    t.thorn = 556;
    t.twosuperior = 300;
    t.Odieresis = 778;
    t.mu = 556;
    t.igrave = 278;
    t.ohungarumlaut = 500;
    t.Eogonek = 667;
    t.dcroat = 556;
    t.threequarters = 750;
    t.Scedilla = 556;
    t.lcaron = 394;
    t.Kcommaaccent = 778;
    t.Lacute = 667;
    t.trademark = 1000;
    t.edotaccent = 444;
    t.Igrave = 389;
    t.Imacron = 389;
    t.Lcaron = 667;
    t.onehalf = 750;
    t.lessequal = 549;
    t.ocircumflex = 500;
    t.ntilde = 556;
    t.Uhungarumlaut = 722;
    t.Eacute = 667;
    t.emacron = 444;
    t.gbreve = 500;
    t.onequarter = 750;
    t.Scaron = 556;
    t.Scommaaccent = 556;
    t.Ohungarumlaut = 778;
    t.degree = 400;
    t.ograve = 500;
    t.Ccaron = 722;
    t.ugrave = 556;
    t.radical = 549;
    t.Dcaron = 722;
    t.rcommaaccent = 444;
    t.Ntilde = 722;
    t.otilde = 500;
    t.Rcommaaccent = 722;
    t.Lcommaaccent = 667;
    t.Atilde = 722;
    t.Aogonek = 722;
    t.Aring = 722;
    t.Otilde = 778;
    t.zdotaccent = 444;
    t.Ecaron = 667;
    t.Iogonek = 389;
    t.kcommaaccent = 556;
    t.minus = 570;
    t.Icircumflex = 389;
    t.ncaron = 556;
    t.tcommaaccent = 333;
    t.logicalnot = 570;
    t.odieresis = 500;
    t.udieresis = 556;
    t.notequal = 549;
    t.gcommaaccent = 500;
    t.eth = 500;
    t.zcaron = 444;
    t.ncommaaccent = 556;
    t.onesuperior = 300;
    t.imacron = 278;
    t.Euro = 500;
  });
  t["Times-BoldItalic"] = getLookupTableFactory(function (t) {
    t.space = 250;
    t.exclam = 389;
    t.quotedbl = 555;
    t.numbersign = 500;
    t.dollar = 500;
    t.percent = 833;
    t.ampersand = 778;
    t.quoteright = 333;
    t.parenleft = 333;
    t.parenright = 333;
    t.asterisk = 500;
    t.plus = 570;
    t.comma = 250;
    t.hyphen = 333;
    t.period = 250;
    t.slash = 278;
    t.zero = 500;
    t.one = 500;
    t.two = 500;
    t.three = 500;
    t.four = 500;
    t.five = 500;
    t.six = 500;
    t.seven = 500;
    t.eight = 500;
    t.nine = 500;
    t.colon = 333;
    t.semicolon = 333;
    t.less = 570;
    t.equal = 570;
    t.greater = 570;
    t.question = 500;
    t.at = 832;
    t.A = 667;
    t.B = 667;
    t.C = 667;
    t.D = 722;
    t.E = 667;
    t.F = 667;
    t.G = 722;
    t.H = 778;
    t.I = 389;
    t.J = 500;
    t.K = 667;
    t.L = 611;
    t.M = 889;
    t.N = 722;
    t.O = 722;
    t.P = 611;
    t.Q = 722;
    t.R = 667;
    t.S = 556;
    t.T = 611;
    t.U = 722;
    t.V = 667;
    t.W = 889;
    t.X = 667;
    t.Y = 611;
    t.Z = 611;
    t.bracketleft = 333;
    t.backslash = 278;
    t.bracketright = 333;
    t.asciicircum = 570;
    t.underscore = 500;
    t.quoteleft = 333;
    t.a = 500;
    t.b = 500;
    t.c = 444;
    t.d = 500;
    t.e = 444;
    t.f = 333;
    t.g = 500;
    t.h = 556;
    t.i = 278;
    t.j = 278;
    t.k = 500;
    t.l = 278;
    t.m = 778;
    t.n = 556;
    t.o = 500;
    t.p = 500;
    t.q = 500;
    t.r = 389;
    t.s = 389;
    t.t = 278;
    t.u = 556;
    t.v = 444;
    t.w = 667;
    t.x = 500;
    t.y = 444;
    t.z = 389;
    t.braceleft = 348;
    t.bar = 220;
    t.braceright = 348;
    t.asciitilde = 570;
    t.exclamdown = 389;
    t.cent = 500;
    t.sterling = 500;
    t.fraction = 167;
    t.yen = 500;
    t.florin = 500;
    t.section = 500;
    t.currency = 500;
    t.quotesingle = 278;
    t.quotedblleft = 500;
    t.guillemotleft = 500;
    t.guilsinglleft = 333;
    t.guilsinglright = 333;
    t.fi = 556;
    t.fl = 556;
    t.endash = 500;
    t.dagger = 500;
    t.daggerdbl = 500;
    t.periodcentered = 250;
    t.paragraph = 500;
    t.bullet = 350;
    t.quotesinglbase = 333;
    t.quotedblbase = 500;
    t.quotedblright = 500;
    t.guillemotright = 500;
    t.ellipsis = 1000;
    t.perthousand = 1000;
    t.questiondown = 500;
    t.grave = 333;
    t.acute = 333;
    t.circumflex = 333;
    t.tilde = 333;
    t.macron = 333;
    t.breve = 333;
    t.dotaccent = 333;
    t.dieresis = 333;
    t.ring = 333;
    t.cedilla = 333;
    t.hungarumlaut = 333;
    t.ogonek = 333;
    t.caron = 333;
    t.emdash = 1000;
    t.AE = 944;
    t.ordfeminine = 266;
    t.Lslash = 611;
    t.Oslash = 722;
    t.OE = 944;
    t.ordmasculine = 300;
    t.ae = 722;
    t.dotlessi = 278;
    t.lslash = 278;
    t.oslash = 500;
    t.oe = 722;
    t.germandbls = 500;
    t.Idieresis = 389;
    t.eacute = 444;
    t.abreve = 500;
    t.uhungarumlaut = 556;
    t.ecaron = 444;
    t.Ydieresis = 611;
    t.divide = 570;
    t.Yacute = 611;
    t.Acircumflex = 667;
    t.aacute = 500;
    t.Ucircumflex = 722;
    t.yacute = 444;
    t.scommaaccent = 389;
    t.ecircumflex = 444;
    t.Uring = 722;
    t.Udieresis = 722;
    t.aogonek = 500;
    t.Uacute = 722;
    t.uogonek = 556;
    t.Edieresis = 667;
    t.Dcroat = 722;
    t.commaaccent = 250;
    t.copyright = 747;
    t.Emacron = 667;
    t.ccaron = 444;
    t.aring = 500;
    t.Ncommaaccent = 722;
    t.lacute = 278;
    t.agrave = 500;
    t.Tcommaaccent = 611;
    t.Cacute = 667;
    t.atilde = 500;
    t.Edotaccent = 667;
    t.scaron = 389;
    t.scedilla = 389;
    t.iacute = 278;
    t.lozenge = 494;
    t.Rcaron = 667;
    t.Gcommaaccent = 722;
    t.ucircumflex = 556;
    t.acircumflex = 500;
    t.Amacron = 667;
    t.rcaron = 389;
    t.ccedilla = 444;
    t.Zdotaccent = 611;
    t.Thorn = 611;
    t.Omacron = 722;
    t.Racute = 667;
    t.Sacute = 556;
    t.dcaron = 608;
    t.Umacron = 722;
    t.uring = 556;
    t.threesuperior = 300;
    t.Ograve = 722;
    t.Agrave = 667;
    t.Abreve = 667;
    t.multiply = 570;
    t.uacute = 556;
    t.Tcaron = 611;
    t.partialdiff = 494;
    t.ydieresis = 444;
    t.Nacute = 722;
    t.icircumflex = 278;
    t.Ecircumflex = 667;
    t.adieresis = 500;
    t.edieresis = 444;
    t.cacute = 444;
    t.nacute = 556;
    t.umacron = 556;
    t.Ncaron = 722;
    t.Iacute = 389;
    t.plusminus = 570;
    t.brokenbar = 220;
    t.registered = 747;
    t.Gbreve = 722;
    t.Idotaccent = 389;
    t.summation = 600;
    t.Egrave = 667;
    t.racute = 389;
    t.omacron = 500;
    t.Zacute = 611;
    t.Zcaron = 611;
    t.greaterequal = 549;
    t.Eth = 722;
    t.Ccedilla = 667;
    t.lcommaaccent = 278;
    t.tcaron = 366;
    t.eogonek = 444;
    t.Uogonek = 722;
    t.Aacute = 667;
    t.Adieresis = 667;
    t.egrave = 444;
    t.zacute = 389;
    t.iogonek = 278;
    t.Oacute = 722;
    t.oacute = 500;
    t.amacron = 500;
    t.sacute = 389;
    t.idieresis = 278;
    t.Ocircumflex = 722;
    t.Ugrave = 722;
    t.Delta = 612;
    t.thorn = 500;
    t.twosuperior = 300;
    t.Odieresis = 722;
    t.mu = 576;
    t.igrave = 278;
    t.ohungarumlaut = 500;
    t.Eogonek = 667;
    t.dcroat = 500;
    t.threequarters = 750;
    t.Scedilla = 556;
    t.lcaron = 382;
    t.Kcommaaccent = 667;
    t.Lacute = 611;
    t.trademark = 1000;
    t.edotaccent = 444;
    t.Igrave = 389;
    t.Imacron = 389;
    t.Lcaron = 611;
    t.onehalf = 750;
    t.lessequal = 549;
    t.ocircumflex = 500;
    t.ntilde = 556;
    t.Uhungarumlaut = 722;
    t.Eacute = 667;
    t.emacron = 444;
    t.gbreve = 500;
    t.onequarter = 750;
    t.Scaron = 556;
    t.Scommaaccent = 556;
    t.Ohungarumlaut = 722;
    t.degree = 400;
    t.ograve = 500;
    t.Ccaron = 667;
    t.ugrave = 556;
    t.radical = 549;
    t.Dcaron = 722;
    t.rcommaaccent = 389;
    t.Ntilde = 722;
    t.otilde = 500;
    t.Rcommaaccent = 667;
    t.Lcommaaccent = 611;
    t.Atilde = 667;
    t.Aogonek = 667;
    t.Aring = 667;
    t.Otilde = 722;
    t.zdotaccent = 389;
    t.Ecaron = 667;
    t.Iogonek = 389;
    t.kcommaaccent = 500;
    t.minus = 606;
    t.Icircumflex = 389;
    t.ncaron = 556;
    t.tcommaaccent = 278;
    t.logicalnot = 606;
    t.odieresis = 500;
    t.udieresis = 556;
    t.notequal = 549;
    t.gcommaaccent = 500;
    t.eth = 500;
    t.zcaron = 389;
    t.ncommaaccent = 556;
    t.onesuperior = 300;
    t.imacron = 278;
    t.Euro = 500;
  });
  t["Times-Italic"] = getLookupTableFactory(function (t) {
    t.space = 250;
    t.exclam = 333;
    t.quotedbl = 420;
    t.numbersign = 500;
    t.dollar = 500;
    t.percent = 833;
    t.ampersand = 778;
    t.quoteright = 333;
    t.parenleft = 333;
    t.parenright = 333;
    t.asterisk = 500;
    t.plus = 675;
    t.comma = 250;
    t.hyphen = 333;
    t.period = 250;
    t.slash = 278;
    t.zero = 500;
    t.one = 500;
    t.two = 500;
    t.three = 500;
    t.four = 500;
    t.five = 500;
    t.six = 500;
    t.seven = 500;
    t.eight = 500;
    t.nine = 500;
    t.colon = 333;
    t.semicolon = 333;
    t.less = 675;
    t.equal = 675;
    t.greater = 675;
    t.question = 500;
    t.at = 920;
    t.A = 611;
    t.B = 611;
    t.C = 667;
    t.D = 722;
    t.E = 611;
    t.F = 611;
    t.G = 722;
    t.H = 722;
    t.I = 333;
    t.J = 444;
    t.K = 667;
    t.L = 556;
    t.M = 833;
    t.N = 667;
    t.O = 722;
    t.P = 611;
    t.Q = 722;
    t.R = 611;
    t.S = 500;
    t.T = 556;
    t.U = 722;
    t.V = 611;
    t.W = 833;
    t.X = 611;
    t.Y = 556;
    t.Z = 556;
    t.bracketleft = 389;
    t.backslash = 278;
    t.bracketright = 389;
    t.asciicircum = 422;
    t.underscore = 500;
    t.quoteleft = 333;
    t.a = 500;
    t.b = 500;
    t.c = 444;
    t.d = 500;
    t.e = 444;
    t.f = 278;
    t.g = 500;
    t.h = 500;
    t.i = 278;
    t.j = 278;
    t.k = 444;
    t.l = 278;
    t.m = 722;
    t.n = 500;
    t.o = 500;
    t.p = 500;
    t.q = 500;
    t.r = 389;
    t.s = 389;
    t.t = 278;
    t.u = 500;
    t.v = 444;
    t.w = 667;
    t.x = 444;
    t.y = 444;
    t.z = 389;
    t.braceleft = 400;
    t.bar = 275;
    t.braceright = 400;
    t.asciitilde = 541;
    t.exclamdown = 389;
    t.cent = 500;
    t.sterling = 500;
    t.fraction = 167;
    t.yen = 500;
    t.florin = 500;
    t.section = 500;
    t.currency = 500;
    t.quotesingle = 214;
    t.quotedblleft = 556;
    t.guillemotleft = 500;
    t.guilsinglleft = 333;
    t.guilsinglright = 333;
    t.fi = 500;
    t.fl = 500;
    t.endash = 500;
    t.dagger = 500;
    t.daggerdbl = 500;
    t.periodcentered = 250;
    t.paragraph = 523;
    t.bullet = 350;
    t.quotesinglbase = 333;
    t.quotedblbase = 556;
    t.quotedblright = 556;
    t.guillemotright = 500;
    t.ellipsis = 889;
    t.perthousand = 1000;
    t.questiondown = 500;
    t.grave = 333;
    t.acute = 333;
    t.circumflex = 333;
    t.tilde = 333;
    t.macron = 333;
    t.breve = 333;
    t.dotaccent = 333;
    t.dieresis = 333;
    t.ring = 333;
    t.cedilla = 333;
    t.hungarumlaut = 333;
    t.ogonek = 333;
    t.caron = 333;
    t.emdash = 889;
    t.AE = 889;
    t.ordfeminine = 276;
    t.Lslash = 556;
    t.Oslash = 722;
    t.OE = 944;
    t.ordmasculine = 310;
    t.ae = 667;
    t.dotlessi = 278;
    t.lslash = 278;
    t.oslash = 500;
    t.oe = 667;
    t.germandbls = 500;
    t.Idieresis = 333;
    t.eacute = 444;
    t.abreve = 500;
    t.uhungarumlaut = 500;
    t.ecaron = 444;
    t.Ydieresis = 556;
    t.divide = 675;
    t.Yacute = 556;
    t.Acircumflex = 611;
    t.aacute = 500;
    t.Ucircumflex = 722;
    t.yacute = 444;
    t.scommaaccent = 389;
    t.ecircumflex = 444;
    t.Uring = 722;
    t.Udieresis = 722;
    t.aogonek = 500;
    t.Uacute = 722;
    t.uogonek = 500;
    t.Edieresis = 611;
    t.Dcroat = 722;
    t.commaaccent = 250;
    t.copyright = 760;
    t.Emacron = 611;
    t.ccaron = 444;
    t.aring = 500;
    t.Ncommaaccent = 667;
    t.lacute = 278;
    t.agrave = 500;
    t.Tcommaaccent = 556;
    t.Cacute = 667;
    t.atilde = 500;
    t.Edotaccent = 611;
    t.scaron = 389;
    t.scedilla = 389;
    t.iacute = 278;
    t.lozenge = 471;
    t.Rcaron = 611;
    t.Gcommaaccent = 722;
    t.ucircumflex = 500;
    t.acircumflex = 500;
    t.Amacron = 611;
    t.rcaron = 389;
    t.ccedilla = 444;
    t.Zdotaccent = 556;
    t.Thorn = 611;
    t.Omacron = 722;
    t.Racute = 611;
    t.Sacute = 500;
    t.dcaron = 544;
    t.Umacron = 722;
    t.uring = 500;
    t.threesuperior = 300;
    t.Ograve = 722;
    t.Agrave = 611;
    t.Abreve = 611;
    t.multiply = 675;
    t.uacute = 500;
    t.Tcaron = 556;
    t.partialdiff = 476;
    t.ydieresis = 444;
    t.Nacute = 667;
    t.icircumflex = 278;
    t.Ecircumflex = 611;
    t.adieresis = 500;
    t.edieresis = 444;
    t.cacute = 444;
    t.nacute = 500;
    t.umacron = 500;
    t.Ncaron = 667;
    t.Iacute = 333;
    t.plusminus = 675;
    t.brokenbar = 275;
    t.registered = 760;
    t.Gbreve = 722;
    t.Idotaccent = 333;
    t.summation = 600;
    t.Egrave = 611;
    t.racute = 389;
    t.omacron = 500;
    t.Zacute = 556;
    t.Zcaron = 556;
    t.greaterequal = 549;
    t.Eth = 722;
    t.Ccedilla = 667;
    t.lcommaaccent = 278;
    t.tcaron = 300;
    t.eogonek = 444;
    t.Uogonek = 722;
    t.Aacute = 611;
    t.Adieresis = 611;
    t.egrave = 444;
    t.zacute = 389;
    t.iogonek = 278;
    t.Oacute = 722;
    t.oacute = 500;
    t.amacron = 500;
    t.sacute = 389;
    t.idieresis = 278;
    t.Ocircumflex = 722;
    t.Ugrave = 722;
    t.Delta = 612;
    t.thorn = 500;
    t.twosuperior = 300;
    t.Odieresis = 722;
    t.mu = 500;
    t.igrave = 278;
    t.ohungarumlaut = 500;
    t.Eogonek = 611;
    t.dcroat = 500;
    t.threequarters = 750;
    t.Scedilla = 500;
    t.lcaron = 300;
    t.Kcommaaccent = 667;
    t.Lacute = 556;
    t.trademark = 980;
    t.edotaccent = 444;
    t.Igrave = 333;
    t.Imacron = 333;
    t.Lcaron = 611;
    t.onehalf = 750;
    t.lessequal = 549;
    t.ocircumflex = 500;
    t.ntilde = 500;
    t.Uhungarumlaut = 722;
    t.Eacute = 611;
    t.emacron = 444;
    t.gbreve = 500;
    t.onequarter = 750;
    t.Scaron = 500;
    t.Scommaaccent = 500;
    t.Ohungarumlaut = 722;
    t.degree = 400;
    t.ograve = 500;
    t.Ccaron = 667;
    t.ugrave = 500;
    t.radical = 453;
    t.Dcaron = 722;
    t.rcommaaccent = 389;
    t.Ntilde = 667;
    t.otilde = 500;
    t.Rcommaaccent = 611;
    t.Lcommaaccent = 556;
    t.Atilde = 611;
    t.Aogonek = 611;
    t.Aring = 611;
    t.Otilde = 722;
    t.zdotaccent = 389;
    t.Ecaron = 611;
    t.Iogonek = 333;
    t.kcommaaccent = 444;
    t.minus = 675;
    t.Icircumflex = 333;
    t.ncaron = 500;
    t.tcommaaccent = 278;
    t.logicalnot = 675;
    t.odieresis = 500;
    t.udieresis = 500;
    t.notequal = 549;
    t.gcommaaccent = 500;
    t.eth = 500;
    t.zcaron = 389;
    t.ncommaaccent = 500;
    t.onesuperior = 300;
    t.imacron = 278;
    t.Euro = 500;
  });
  t.ZapfDingbats = getLookupTableFactory(function (t) {
    t.space = 278;
    t.a1 = 974;
    t.a2 = 961;
    t.a202 = 974;
    t.a3 = 980;
    t.a4 = 719;
    t.a5 = 789;
    t.a119 = 790;
    t.a118 = 791;
    t.a117 = 690;
    t.a11 = 960;
    t.a12 = 939;
    t.a13 = 549;
    t.a14 = 855;
    t.a15 = 911;
    t.a16 = 933;
    t.a105 = 911;
    t.a17 = 945;
    t.a18 = 974;
    t.a19 = 755;
    t.a20 = 846;
    t.a21 = 762;
    t.a22 = 761;
    t.a23 = 571;
    t.a24 = 677;
    t.a25 = 763;
    t.a26 = 760;
    t.a27 = 759;
    t.a28 = 754;
    t.a6 = 494;
    t.a7 = 552;
    t.a8 = 537;
    t.a9 = 577;
    t.a10 = 692;
    t.a29 = 786;
    t.a30 = 788;
    t.a31 = 788;
    t.a32 = 790;
    t.a33 = 793;
    t.a34 = 794;
    t.a35 = 816;
    t.a36 = 823;
    t.a37 = 789;
    t.a38 = 841;
    t.a39 = 823;
    t.a40 = 833;
    t.a41 = 816;
    t.a42 = 831;
    t.a43 = 923;
    t.a44 = 744;
    t.a45 = 723;
    t.a46 = 749;
    t.a47 = 790;
    t.a48 = 792;
    t.a49 = 695;
    t.a50 = 776;
    t.a51 = 768;
    t.a52 = 792;
    t.a53 = 759;
    t.a54 = 707;
    t.a55 = 708;
    t.a56 = 682;
    t.a57 = 701;
    t.a58 = 826;
    t.a59 = 815;
    t.a60 = 789;
    t.a61 = 789;
    t.a62 = 707;
    t.a63 = 687;
    t.a64 = 696;
    t.a65 = 689;
    t.a66 = 786;
    t.a67 = 787;
    t.a68 = 713;
    t.a69 = 791;
    t.a70 = 785;
    t.a71 = 791;
    t.a72 = 873;
    t.a73 = 761;
    t.a74 = 762;
    t.a203 = 762;
    t.a75 = 759;
    t.a204 = 759;
    t.a76 = 892;
    t.a77 = 892;
    t.a78 = 788;
    t.a79 = 784;
    t.a81 = 438;
    t.a82 = 138;
    t.a83 = 277;
    t.a84 = 415;
    t.a97 = 392;
    t.a98 = 392;
    t.a99 = 668;
    t.a100 = 668;
    t.a89 = 390;
    t.a90 = 390;
    t.a93 = 317;
    t.a94 = 317;
    t.a91 = 276;
    t.a92 = 276;
    t.a205 = 509;
    t.a85 = 509;
    t.a206 = 410;
    t.a86 = 410;
    t.a87 = 234;
    t.a88 = 234;
    t.a95 = 334;
    t.a96 = 334;
    t.a101 = 732;
    t.a102 = 544;
    t.a103 = 544;
    t.a104 = 910;
    t.a106 = 667;
    t.a107 = 760;
    t.a108 = 760;
    t.a112 = 776;
    t.a111 = 595;
    t.a110 = 694;
    t.a109 = 626;
    t.a120 = 788;
    t.a121 = 788;
    t.a122 = 788;
    t.a123 = 788;
    t.a124 = 788;
    t.a125 = 788;
    t.a126 = 788;
    t.a127 = 788;
    t.a128 = 788;
    t.a129 = 788;
    t.a130 = 788;
    t.a131 = 788;
    t.a132 = 788;
    t.a133 = 788;
    t.a134 = 788;
    t.a135 = 788;
    t.a136 = 788;
    t.a137 = 788;
    t.a138 = 788;
    t.a139 = 788;
    t.a140 = 788;
    t.a141 = 788;
    t.a142 = 788;
    t.a143 = 788;
    t.a144 = 788;
    t.a145 = 788;
    t.a146 = 788;
    t.a147 = 788;
    t.a148 = 788;
    t.a149 = 788;
    t.a150 = 788;
    t.a151 = 788;
    t.a152 = 788;
    t.a153 = 788;
    t.a154 = 788;
    t.a155 = 788;
    t.a156 = 788;
    t.a157 = 788;
    t.a158 = 788;
    t.a159 = 788;
    t.a160 = 894;
    t.a161 = 838;
    t.a163 = 1016;
    t.a164 = 458;
    t.a196 = 748;
    t.a165 = 924;
    t.a192 = 748;
    t.a166 = 918;
    t.a167 = 927;
    t.a168 = 928;
    t.a169 = 928;
    t.a170 = 834;
    t.a171 = 873;
    t.a172 = 828;
    t.a173 = 924;
    t.a162 = 924;
    t.a174 = 917;
    t.a175 = 930;
    t.a176 = 931;
    t.a177 = 463;
    t.a178 = 883;
    t.a179 = 836;
    t.a193 = 836;
    t.a180 = 867;
    t.a199 = 867;
    t.a181 = 696;
    t.a200 = 696;
    t.a182 = 874;
    t.a201 = 874;
    t.a183 = 760;
    t.a184 = 946;
    t.a197 = 771;
    t.a185 = 865;
    t.a194 = 771;
    t.a198 = 888;
    t.a186 = 967;
    t.a195 = 888;
    t.a187 = 831;
    t.a188 = 873;
    t.a189 = 927;
    t.a190 = 970;
    t.a191 = 918;
  });
});
const getFontBasicMetrics = getLookupTableFactory(function (t) {
  t.Courier = {
    ascent: 629,
    descent: -157,
    capHeight: 562,
    xHeight: -426
  };
  t["Courier-Bold"] = {
    ascent: 629,
    descent: -157,
    capHeight: 562,
    xHeight: 439
  };
  t["Courier-Oblique"] = {
    ascent: 629,
    descent: -157,
    capHeight: 562,
    xHeight: 426
  };
  t["Courier-BoldOblique"] = {
    ascent: 629,
    descent: -157,
    capHeight: 562,
    xHeight: 426
  };
  t.Helvetica = {
    ascent: 718,
    descent: -207,
    capHeight: 718,
    xHeight: 523
  };
  t["Helvetica-Bold"] = {
    ascent: 718,
    descent: -207,
    capHeight: 718,
    xHeight: 532
  };
  t["Helvetica-Oblique"] = {
    ascent: 718,
    descent: -207,
    capHeight: 718,
    xHeight: 523
  };
  t["Helvetica-BoldOblique"] = {
    ascent: 718,
    descent: -207,
    capHeight: 718,
    xHeight: 532
  };
  t["Times-Roman"] = {
    ascent: 683,
    descent: -217,
    capHeight: 662,
    xHeight: 450
  };
  t["Times-Bold"] = {
    ascent: 683,
    descent: -217,
    capHeight: 676,
    xHeight: 461
  };
  t["Times-Italic"] = {
    ascent: 683,
    descent: -217,
    capHeight: 653,
    xHeight: 441
  };
  t["Times-BoldItalic"] = {
    ascent: 683,
    descent: -217,
    capHeight: 669,
    xHeight: 462
  };
  t.Symbol = {
    ascent: Math.NaN,
    descent: Math.NaN,
    capHeight: Math.NaN,
    xHeight: Math.NaN
  };
  t.ZapfDingbats = {
    ascent: Math.NaN,
    descent: Math.NaN,
    capHeight: Math.NaN,
    xHeight: Math.NaN
  };
});

;// ./src/core/glyf.js











const ON_CURVE_POINT = 1 << 0;
const X_SHORT_VECTOR = 1 << 1;
const Y_SHORT_VECTOR = 1 << 2;
const REPEAT_FLAG = 1 << 3;
const X_IS_SAME_OR_POSITIVE_X_SHORT_VECTOR = 1 << 4;
const Y_IS_SAME_OR_POSITIVE_Y_SHORT_VECTOR = 1 << 5;
const OVERLAP_SIMPLE = 1 << 6;
const ARG_1_AND_2_ARE_WORDS = 1 << 0;
const ARGS_ARE_XY_VALUES = 1 << 1;
const WE_HAVE_A_SCALE = 1 << 3;
const MORE_COMPONENTS = 1 << 5;
const WE_HAVE_AN_X_AND_Y_SCALE = 1 << 6;
const WE_HAVE_A_TWO_BY_TWO = 1 << 7;
const WE_HAVE_INSTRUCTIONS = 1 << 8;
class GlyfTable {
  constructor({
    glyfTable,
    isGlyphLocationsLong,
    locaTable,
    numGlyphs
  }) {
    this.glyphs = [];
    const loca = new DataView(locaTable.buffer, locaTable.byteOffset, locaTable.byteLength);
    const glyf = new DataView(glyfTable.buffer, glyfTable.byteOffset, glyfTable.byteLength);
    const offsetSize = isGlyphLocationsLong ? 4 : 2;
    let prev = isGlyphLocationsLong ? loca.getUint32(0) : 2 * loca.getUint16(0);
    let pos = 0;
    for (let i = 0; i < numGlyphs; i++) {
      pos += offsetSize;
      const next = isGlyphLocationsLong ? loca.getUint32(pos) : 2 * loca.getUint16(pos);
      if (next === prev) {
        this.glyphs.push(new Glyph({}));
        continue;
      }
      const glyph = Glyph.parse(prev, glyf);
      this.glyphs.push(glyph);
      prev = next;
    }
  }
  getSize() {
    return Math.sumPrecise(this.glyphs.map(g => g.getSize() + 3 & ~3));
  }
  write() {
    const totalSize = this.getSize();
    const glyfTable = new DataView(new ArrayBuffer(totalSize));
    const isLocationLong = totalSize > 0x1fffe;
    const offsetSize = isLocationLong ? 4 : 2;
    const locaTable = new DataView(new ArrayBuffer((this.glyphs.length + 1) * offsetSize));
    if (isLocationLong) {
      locaTable.setUint32(0, 0);
    } else {
      locaTable.setUint16(0, 0);
    }
    let pos = 0;
    let locaIndex = 0;
    for (const glyph of this.glyphs) {
      pos += glyph.write(pos, glyfTable);
      pos = pos + 3 & ~3;
      locaIndex += offsetSize;
      if (isLocationLong) {
        locaTable.setUint32(locaIndex, pos);
      } else {
        locaTable.setUint16(locaIndex, pos >> 1);
      }
    }
    return {
      isLocationLong,
      loca: new Uint8Array(locaTable.buffer),
      glyf: new Uint8Array(glyfTable.buffer)
    };
  }
  scale(factors) {
    for (let i = 0, ii = this.glyphs.length; i < ii; i++) {
      this.glyphs[i].scale(factors[i]);
    }
  }
}
class Glyph {
  constructor({
    header = null,
    simple = null,
    composites = null
  }) {
    this.header = header;
    this.simple = simple;
    this.composites = composites;
  }
  static parse(pos, glyf) {
    const [read, header] = GlyphHeader.parse(pos, glyf);
    pos += read;
    if (header.numberOfContours < 0) {
      const composites = [];
      while (true) {
        const [n, composite] = CompositeGlyph.parse(pos, glyf);
        pos += n;
        composites.push(composite);
        if (!(composite.flags & MORE_COMPONENTS)) {
          break;
        }
      }
      return new Glyph({
        header,
        composites
      });
    }
    const simple = SimpleGlyph.parse(pos, glyf, header.numberOfContours);
    return new Glyph({
      header,
      simple
    });
  }
  getSize() {
    if (!this.header) {
      return 0;
    }
    const size = this.simple ? this.simple.getSize() : Math.sumPrecise(this.composites.map(c => c.getSize()));
    return this.header.getSize() + size;
  }
  write(pos, buf) {
    if (!this.header) {
      return 0;
    }
    const spos = pos;
    pos += this.header.write(pos, buf);
    if (this.simple) {
      pos += this.simple.write(pos, buf);
    } else {
      for (const composite of this.composites) {
        pos += composite.write(pos, buf);
      }
    }
    return pos - spos;
  }
  scale(factor) {
    if (!this.header) {
      return;
    }
    const xMiddle = (this.header.xMin + this.header.xMax) / 2;
    this.header.scale(xMiddle, factor);
    if (this.simple) {
      this.simple.scale(xMiddle, factor);
    } else {
      for (const composite of this.composites) {
        composite.scale(xMiddle, factor);
      }
    }
  }
}
class GlyphHeader {
  constructor({
    numberOfContours,
    xMin,
    yMin,
    xMax,
    yMax
  }) {
    this.numberOfContours = numberOfContours;
    this.xMin = xMin;
    this.yMin = yMin;
    this.xMax = xMax;
    this.yMax = yMax;
  }
  static parse(pos, glyf) {
    return [10, new GlyphHeader({
      numberOfContours: glyf.getInt16(pos),
      xMin: glyf.getInt16(pos + 2),
      yMin: glyf.getInt16(pos + 4),
      xMax: glyf.getInt16(pos + 6),
      yMax: glyf.getInt16(pos + 8)
    })];
  }
  getSize() {
    return 10;
  }
  write(pos, buf) {
    buf.setInt16(pos, this.numberOfContours);
    buf.setInt16(pos + 2, this.xMin);
    buf.setInt16(pos + 4, this.yMin);
    buf.setInt16(pos + 6, this.xMax);
    buf.setInt16(pos + 8, this.yMax);
    return 10;
  }
  scale(x, factor) {
    this.xMin = Math.round(x + (this.xMin - x) * factor);
    this.xMax = Math.round(x + (this.xMax - x) * factor);
  }
}
class Contour {
  constructor({
    flags,
    xCoordinates,
    yCoordinates
  }) {
    this.xCoordinates = xCoordinates;
    this.yCoordinates = yCoordinates;
    this.flags = flags;
  }
}
class SimpleGlyph {
  constructor({
    contours,
    instructions
  }) {
    this.contours = contours;
    this.instructions = instructions;
  }
  static parse(pos, glyf, numberOfContours) {
    const endPtsOfContours = [];
    for (let i = 0; i < numberOfContours; i++) {
      const endPt = glyf.getUint16(pos);
      pos += 2;
      endPtsOfContours.push(endPt);
    }
    const numberOfPt = endPtsOfContours[numberOfContours - 1] + 1;
    const instructionLength = glyf.getUint16(pos);
    pos += 2;
    const instructions = new Uint8Array(glyf).slice(pos, pos + instructionLength);
    pos += instructionLength;
    const flags = [];
    for (let i = 0; i < numberOfPt; pos++, i++) {
      let flag = glyf.getUint8(pos);
      flags.push(flag);
      if (flag & REPEAT_FLAG) {
        const count = glyf.getUint8(++pos);
        flag ^= REPEAT_FLAG;
        for (let m = 0; m < count; m++) {
          flags.push(flag);
        }
        i += count;
      }
    }
    const allXCoordinates = [];
    let xCoordinates = [];
    let yCoordinates = [];
    let pointFlags = [];
    const contours = [];
    let endPtsOfContoursIndex = 0;
    let lastCoordinate = 0;
    for (let i = 0; i < numberOfPt; i++) {
      const flag = flags[i];
      if (flag & X_SHORT_VECTOR) {
        const x = glyf.getUint8(pos++);
        lastCoordinate += flag & X_IS_SAME_OR_POSITIVE_X_SHORT_VECTOR ? x : -x;
        xCoordinates.push(lastCoordinate);
      } else if (flag & X_IS_SAME_OR_POSITIVE_X_SHORT_VECTOR) {
        xCoordinates.push(lastCoordinate);
      } else {
        lastCoordinate += glyf.getInt16(pos);
        pos += 2;
        xCoordinates.push(lastCoordinate);
      }
      if (endPtsOfContours[endPtsOfContoursIndex] === i) {
        endPtsOfContoursIndex++;
        allXCoordinates.push(xCoordinates);
        xCoordinates = [];
      }
    }
    lastCoordinate = 0;
    endPtsOfContoursIndex = 0;
    for (let i = 0; i < numberOfPt; i++) {
      const flag = flags[i];
      if (flag & Y_SHORT_VECTOR) {
        const y = glyf.getUint8(pos++);
        lastCoordinate += flag & Y_IS_SAME_OR_POSITIVE_Y_SHORT_VECTOR ? y : -y;
        yCoordinates.push(lastCoordinate);
      } else if (flag & Y_IS_SAME_OR_POSITIVE_Y_SHORT_VECTOR) {
        yCoordinates.push(lastCoordinate);
      } else {
        lastCoordinate += glyf.getInt16(pos);
        pos += 2;
        yCoordinates.push(lastCoordinate);
      }
      pointFlags.push(flag & ON_CURVE_POINT | flag & OVERLAP_SIMPLE);
      if (endPtsOfContours[endPtsOfContoursIndex] === i) {
        xCoordinates = allXCoordinates[endPtsOfContoursIndex];
        endPtsOfContoursIndex++;
        contours.push(new Contour({
          flags: pointFlags,
          xCoordinates,
          yCoordinates
        }));
        yCoordinates = [];
        pointFlags = [];
      }
    }
    return new SimpleGlyph({
      contours,
      instructions
    });
  }
  getSize() {
    let size = this.contours.length * 2 + 2 + this.instructions.length;
    let lastX = 0;
    let lastY = 0;
    for (const contour of this.contours) {
      size += contour.flags.length;
      for (let i = 0, ii = contour.xCoordinates.length; i < ii; i++) {
        const x = contour.xCoordinates[i];
        const y = contour.yCoordinates[i];
        let abs = Math.abs(x - lastX);
        if (abs > 255) {
          size += 2;
        } else if (abs > 0) {
          size += 1;
        }
        lastX = x;
        abs = Math.abs(y - lastY);
        if (abs > 255) {
          size += 2;
        } else if (abs > 0) {
          size += 1;
        }
        lastY = y;
      }
    }
    return size;
  }
  write(pos, buf) {
    const spos = pos;
    const xCoordinates = [];
    const yCoordinates = [];
    const flags = [];
    let lastX = 0;
    let lastY = 0;
    for (const contour of this.contours) {
      for (let i = 0, ii = contour.xCoordinates.length; i < ii; i++) {
        let flag = contour.flags[i];
        const x = contour.xCoordinates[i];
        let delta = x - lastX;
        if (delta === 0) {
          flag |= X_IS_SAME_OR_POSITIVE_X_SHORT_VECTOR;
          xCoordinates.push(0);
        } else {
          const abs = Math.abs(delta);
          if (abs <= 255) {
            flag |= delta >= 0 ? X_SHORT_VECTOR | X_IS_SAME_OR_POSITIVE_X_SHORT_VECTOR : X_SHORT_VECTOR;
            xCoordinates.push(abs);
          } else {
            xCoordinates.push(delta);
          }
        }
        lastX = x;
        const y = contour.yCoordinates[i];
        delta = y - lastY;
        if (delta === 0) {
          flag |= Y_IS_SAME_OR_POSITIVE_Y_SHORT_VECTOR;
          yCoordinates.push(0);
        } else {
          const abs = Math.abs(delta);
          if (abs <= 255) {
            flag |= delta >= 0 ? Y_SHORT_VECTOR | Y_IS_SAME_OR_POSITIVE_Y_SHORT_VECTOR : Y_SHORT_VECTOR;
            yCoordinates.push(abs);
          } else {
            yCoordinates.push(delta);
          }
        }
        lastY = y;
        flags.push(flag);
      }
      buf.setUint16(pos, xCoordinates.length - 1);
      pos += 2;
    }
    buf.setUint16(pos, this.instructions.length);
    pos += 2;
    if (this.instructions.length) {
      new Uint8Array(buf.buffer, 0, buf.buffer.byteLength).set(this.instructions, pos);
      pos += this.instructions.length;
    }
    for (const flag of flags) {
      buf.setUint8(pos++, flag);
    }
    for (let i = 0, ii = xCoordinates.length; i < ii; i++) {
      const x = xCoordinates[i];
      const flag = flags[i];
      if (flag & X_SHORT_VECTOR) {
        buf.setUint8(pos++, x);
      } else if (!(flag & X_IS_SAME_OR_POSITIVE_X_SHORT_VECTOR)) {
        buf.setInt16(pos, x);
        pos += 2;
      }
    }
    for (let i = 0, ii = yCoordinates.length; i < ii; i++) {
      const y = yCoordinates[i];
      const flag = flags[i];
      if (flag & Y_SHORT_VECTOR) {
        buf.setUint8(pos++, y);
      } else if (!(flag & Y_IS_SAME_OR_POSITIVE_Y_SHORT_VECTOR)) {
        buf.setInt16(pos, y);
        pos += 2;
      }
    }
    return pos - spos;
  }
  scale(x, factor) {
    for (const contour of this.contours) {
      if (contour.xCoordinates.length === 0) {
        continue;
      }
      for (let i = 0, ii = contour.xCoordinates.length; i < ii; i++) {
        contour.xCoordinates[i] = Math.round(x + (contour.xCoordinates[i] - x) * factor);
      }
    }
  }
}
class CompositeGlyph {
  constructor({
    flags,
    glyphIndex,
    argument1,
    argument2,
    transf,
    instructions
  }) {
    this.flags = flags;
    this.glyphIndex = glyphIndex;
    this.argument1 = argument1;
    this.argument2 = argument2;
    this.transf = transf;
    this.instructions = instructions;
  }
  static parse(pos, glyf) {
    const spos = pos;
    const transf = [];
    let flags = glyf.getUint16(pos);
    const glyphIndex = glyf.getUint16(pos + 2);
    pos += 4;
    let argument1, argument2;
    if (flags & ARG_1_AND_2_ARE_WORDS) {
      if (flags & ARGS_ARE_XY_VALUES) {
        argument1 = glyf.getInt16(pos);
        argument2 = glyf.getInt16(pos + 2);
      } else {
        argument1 = glyf.getUint16(pos);
        argument2 = glyf.getUint16(pos + 2);
      }
      pos += 4;
      flags ^= ARG_1_AND_2_ARE_WORDS;
    } else {
      if (flags & ARGS_ARE_XY_VALUES) {
        argument1 = glyf.getInt8(pos);
        argument2 = glyf.getInt8(pos + 1);
      } else {
        argument1 = glyf.getUint8(pos);
        argument2 = glyf.getUint8(pos + 1);
      }
      pos += 2;
    }
    if (flags & WE_HAVE_A_SCALE) {
      transf.push(glyf.getUint16(pos));
      pos += 2;
    } else if (flags & WE_HAVE_AN_X_AND_Y_SCALE) {
      transf.push(glyf.getUint16(pos), glyf.getUint16(pos + 2));
      pos += 4;
    } else if (flags & WE_HAVE_A_TWO_BY_TWO) {
      transf.push(glyf.getUint16(pos), glyf.getUint16(pos + 2), glyf.getUint16(pos + 4), glyf.getUint16(pos + 6));
      pos += 8;
    }
    let instructions = null;
    if (flags & WE_HAVE_INSTRUCTIONS) {
      const instructionLength = glyf.getUint16(pos);
      pos += 2;
      instructions = new Uint8Array(glyf).slice(pos, pos + instructionLength);
      pos += instructionLength;
    }
    return [pos - spos, new CompositeGlyph({
      flags,
      glyphIndex,
      argument1,
      argument2,
      transf,
      instructions
    })];
  }
  getSize() {
    let size = 2 + 2 + this.transf.length * 2;
    if (this.flags & WE_HAVE_INSTRUCTIONS) {
      size += 2 + this.instructions.length;
    }
    size += 2;
    if (this.flags & 2) {
      if (!(this.argument1 >= -128 && this.argument1 <= 127 && this.argument2 >= -128 && this.argument2 <= 127)) {
        size += 2;
      }
    } else if (!(this.argument1 >= 0 && this.argument1 <= 255 && this.argument2 >= 0 && this.argument2 <= 255)) {
      size += 2;
    }
    return size;
  }
  write(pos, buf) {
    const spos = pos;
    if (this.flags & ARGS_ARE_XY_VALUES) {
      if (!(this.argument1 >= -128 && this.argument1 <= 127 && this.argument2 >= -128 && this.argument2 <= 127)) {
        this.flags |= ARG_1_AND_2_ARE_WORDS;
      }
    } else if (!(this.argument1 >= 0 && this.argument1 <= 255 && this.argument2 >= 0 && this.argument2 <= 255)) {
      this.flags |= ARG_1_AND_2_ARE_WORDS;
    }
    buf.setUint16(pos, this.flags);
    buf.setUint16(pos + 2, this.glyphIndex);
    pos += 4;
    if (this.flags & ARG_1_AND_2_ARE_WORDS) {
      if (this.flags & ARGS_ARE_XY_VALUES) {
        buf.setInt16(pos, this.argument1);
        buf.setInt16(pos + 2, this.argument2);
      } else {
        buf.setUint16(pos, this.argument1);
        buf.setUint16(pos + 2, this.argument2);
      }
      pos += 4;
    } else {
      buf.setUint8(pos, this.argument1);
      buf.setUint8(pos + 1, this.argument2);
      pos += 2;
    }
    if (this.flags & WE_HAVE_INSTRUCTIONS) {
      buf.setUint16(pos, this.instructions.length);
      pos += 2;
      if (this.instructions.length) {
        new Uint8Array(buf.buffer, 0, buf.buffer.byteLength).set(this.instructions, pos);
        pos += this.instructions.length;
      }
    }
    return pos - spos;
  }
  scale(x, factor) {}
}

;// ./src/core/opentype_file_builder.js










function writeInt16(dest, offset, num) {
  dest[offset] = num >> 8 & 0xff;
  dest[offset + 1] = num & 0xff;
}
function writeInt32(dest, offset, num) {
  dest[offset] = num >> 24 & 0xff;
  dest[offset + 1] = num >> 16 & 0xff;
  dest[offset + 2] = num >> 8 & 0xff;
  dest[offset + 3] = num & 0xff;
}
function writeData(dest, offset, data) {
  if (data instanceof Uint8Array) {
    dest.set(data, offset);
  } else if (typeof data === "string") {
    for (let i = 0, ii = data.length; i < ii; i++) {
      dest[offset++] = data.charCodeAt(i) & 0xff;
    }
  } else {
    for (const num of data) {
      dest[offset++] = num & 0xff;
    }
  }
}
const OTF_HEADER_SIZE = 12;
const OTF_TABLE_ENTRY_SIZE = 16;
class OpenTypeFileBuilder {
  constructor(sfnt) {
    this.sfnt = sfnt;
    this.tables = Object.create(null);
  }
  static getSearchParams(entriesCount, entrySize) {
    let maxPower2 = 1,
      log2 = 0;
    while ((maxPower2 ^ entriesCount) > maxPower2) {
      maxPower2 <<= 1;
      log2++;
    }
    const searchRange = maxPower2 * entrySize;
    return {
      range: searchRange,
      entry: log2,
      rangeShift: entrySize * entriesCount - searchRange
    };
  }
  toArray() {
    let sfnt = this.sfnt;
    const tables = this.tables;
    const tablesNames = Object.keys(tables);
    tablesNames.sort();
    const numTables = tablesNames.length;
    let i, j, jj, table, tableName;
    let offset = OTF_HEADER_SIZE + numTables * OTF_TABLE_ENTRY_SIZE;
    const tableOffsets = [offset];
    for (i = 0; i < numTables; i++) {
      table = tables[tablesNames[i]];
      const paddedLength = (table.length + 3 & ~3) >>> 0;
      offset += paddedLength;
      tableOffsets.push(offset);
    }
    const file = new Uint8Array(offset);
    for (i = 0; i < numTables; i++) {
      table = tables[tablesNames[i]];
      writeData(file, tableOffsets[i], table);
    }
    if (sfnt === "true") {
      sfnt = string32(0x00010000);
    }
    file[0] = sfnt.charCodeAt(0) & 0xff;
    file[1] = sfnt.charCodeAt(1) & 0xff;
    file[2] = sfnt.charCodeAt(2) & 0xff;
    file[3] = sfnt.charCodeAt(3) & 0xff;
    writeInt16(file, 4, numTables);
    const searchParams = OpenTypeFileBuilder.getSearchParams(numTables, 16);
    writeInt16(file, 6, searchParams.range);
    writeInt16(file, 8, searchParams.entry);
    writeInt16(file, 10, searchParams.rangeShift);
    offset = OTF_HEADER_SIZE;
    for (i = 0; i < numTables; i++) {
      tableName = tablesNames[i];
      file[offset] = tableName.charCodeAt(0) & 0xff;
      file[offset + 1] = tableName.charCodeAt(1) & 0xff;
      file[offset + 2] = tableName.charCodeAt(2) & 0xff;
      file[offset + 3] = tableName.charCodeAt(3) & 0xff;
      let checksum = 0;
      for (j = tableOffsets[i], jj = tableOffsets[i + 1]; j < jj; j += 4) {
        const quad = readUint32(file, j);
        checksum = checksum + quad >>> 0;
      }
      writeInt32(file, offset + 4, checksum);
      writeInt32(file, offset + 8, tableOffsets[i]);
      writeInt32(file, offset + 12, tables[tableName].length);
      offset += OTF_TABLE_ENTRY_SIZE;
    }
    return file;
  }
  addTable(tag, data) {
    if (tag in this.tables) {
      throw new Error("Table " + tag + " already exists");
    }
    this.tables[tag] = data;
  }
}

;// ./src/core/type1_parser.js












const HINTING_ENABLED = false;
const COMMAND_MAP = {
  hstem: [1],
  vstem: [3],
  vmoveto: [4],
  rlineto: [5],
  hlineto: [6],
  vlineto: [7],
  rrcurveto: [8],
  callsubr: [10],
  flex: [12, 35],
  drop: [12, 18],
  endchar: [14],
  rmoveto: [21],
  hmoveto: [22],
  vhcurveto: [30],
  hvcurveto: [31]
};
class Type1CharString {
  constructor() {
    this.width = 0;
    this.lsb = 0;
    this.flexing = false;
    this.output = [];
    this.stack = [];
  }
  convert(encoded, subrs, seacAnalysisEnabled) {
    const count = encoded.length;
    let error = false;
    let wx, sbx, subrNumber;
    for (let i = 0; i < count; i++) {
      let value = encoded[i];
      if (value < 32) {
        if (value === 12) {
          value = (value << 8) + encoded[++i];
        }
        switch (value) {
          case 1:
            if (!HINTING_ENABLED) {
              this.stack = [];
              break;
            }
            error = this.executeCommand(2, COMMAND_MAP.hstem);
            break;
          case 3:
            if (!HINTING_ENABLED) {
              this.stack = [];
              break;
            }
            error = this.executeCommand(2, COMMAND_MAP.vstem);
            break;
          case 4:
            if (this.flexing) {
              if (this.stack.length < 1) {
                error = true;
                break;
              }
              const dy = this.stack.pop();
              this.stack.push(0, dy);
              break;
            }
            error = this.executeCommand(1, COMMAND_MAP.vmoveto);
            break;
          case 5:
            error = this.executeCommand(2, COMMAND_MAP.rlineto);
            break;
          case 6:
            error = this.executeCommand(1, COMMAND_MAP.hlineto);
            break;
          case 7:
            error = this.executeCommand(1, COMMAND_MAP.vlineto);
            break;
          case 8:
            error = this.executeCommand(6, COMMAND_MAP.rrcurveto);
            break;
          case 9:
            this.stack = [];
            break;
          case 10:
            if (this.stack.length < 1) {
              error = true;
              break;
            }
            subrNumber = this.stack.pop();
            if (!subrs[subrNumber]) {
              error = true;
              break;
            }
            error = this.convert(subrs[subrNumber], subrs, seacAnalysisEnabled);
            break;
          case 11:
            return error;
          case 13:
            if (this.stack.length < 2) {
              error = true;
              break;
            }
            wx = this.stack.pop();
            sbx = this.stack.pop();
            this.lsb = sbx;
            this.width = wx;
            this.stack.push(wx, sbx);
            error = this.executeCommand(2, COMMAND_MAP.hmoveto);
            break;
          case 14:
            this.output.push(COMMAND_MAP.endchar[0]);
            break;
          case 21:
            if (this.flexing) {
              break;
            }
            error = this.executeCommand(2, COMMAND_MAP.rmoveto);
            break;
          case 22:
            if (this.flexing) {
              this.stack.push(0);
              break;
            }
            error = this.executeCommand(1, COMMAND_MAP.hmoveto);
            break;
          case 30:
            error = this.executeCommand(4, COMMAND_MAP.vhcurveto);
            break;
          case 31:
            error = this.executeCommand(4, COMMAND_MAP.hvcurveto);
            break;
          case (12 << 8) + 0:
            this.stack = [];
            break;
          case (12 << 8) + 1:
            if (!HINTING_ENABLED) {
              this.stack = [];
              break;
            }
            error = this.executeCommand(2, COMMAND_MAP.vstem);
            break;
          case (12 << 8) + 2:
            if (!HINTING_ENABLED) {
              this.stack = [];
              break;
            }
            error = this.executeCommand(2, COMMAND_MAP.hstem);
            break;
          case (12 << 8) + 6:
            if (seacAnalysisEnabled) {
              const asb = this.stack.at(-5);
              this.seac = this.stack.splice(-4, 4);
              this.seac[0] += this.lsb - asb;
              error = this.executeCommand(0, COMMAND_MAP.endchar);
            } else {
              error = this.executeCommand(4, COMMAND_MAP.endchar);
            }
            break;
          case (12 << 8) + 7:
            if (this.stack.length < 4) {
              error = true;
              break;
            }
            this.stack.pop();
            wx = this.stack.pop();
            const sby = this.stack.pop();
            sbx = this.stack.pop();
            this.lsb = sbx;
            this.width = wx;
            this.stack.push(wx, sbx, sby);
            error = this.executeCommand(3, COMMAND_MAP.rmoveto);
            break;
          case (12 << 8) + 12:
            if (this.stack.length < 2) {
              error = true;
              break;
            }
            const num2 = this.stack.pop();
            const num1 = this.stack.pop();
            this.stack.push(num1 / num2);
            break;
          case (12 << 8) + 16:
            if (this.stack.length < 2) {
              error = true;
              break;
            }
            subrNumber = this.stack.pop();
            const numArgs = this.stack.pop();
            if (subrNumber === 0 && numArgs === 3) {
              const flexArgs = this.stack.splice(-17, 17);
              this.stack.push(flexArgs[2] + flexArgs[0], flexArgs[3] + flexArgs[1], flexArgs[4], flexArgs[5], flexArgs[6], flexArgs[7], flexArgs[8], flexArgs[9], flexArgs[10], flexArgs[11], flexArgs[12], flexArgs[13], flexArgs[14]);
              error = this.executeCommand(13, COMMAND_MAP.flex, true);
              this.flexing = false;
              this.stack.push(flexArgs[15], flexArgs[16]);
            } else if (subrNumber === 1 && numArgs === 0) {
              this.flexing = true;
            }
            break;
          case (12 << 8) + 17:
            break;
          case (12 << 8) + 33:
            this.stack = [];
            break;
          default:
            warn('Unknown type 1 charstring command of "' + value + '"');
            break;
        }
        if (error) {
          break;
        }
        continue;
      } else if (value <= 246) {
        value -= 139;
      } else if (value <= 250) {
        value = (value - 247) * 256 + encoded[++i] + 108;
      } else if (value <= 254) {
        value = -((value - 251) * 256) - encoded[++i] - 108;
      } else {
        value = (encoded[++i] & 0xff) << 24 | (encoded[++i] & 0xff) << 16 | (encoded[++i] & 0xff) << 8 | (encoded[++i] & 0xff) << 0;
      }
      this.stack.push(value);
    }
    return error;
  }
  executeCommand(howManyArgs, command, keepStack) {
    const stackLength = this.stack.length;
    if (howManyArgs > stackLength) {
      return true;
    }
    const start = stackLength - howManyArgs;
    for (let i = start; i < stackLength; i++) {
      let value = this.stack[i];
      if (Number.isInteger(value)) {
        this.output.push(28, value >> 8 & 0xff, value & 0xff);
      } else {
        value = 65536 * value | 0;
        this.output.push(255, value >> 24 & 0xff, value >> 16 & 0xff, value >> 8 & 0xff, value & 0xff);
      }
    }
    this.output.push(...command);
    if (keepStack) {
      this.stack.splice(start, howManyArgs);
    } else {
      this.stack.length = 0;
    }
    return false;
  }
}
const EEXEC_ENCRYPT_KEY = 55665;
const CHAR_STRS_ENCRYPT_KEY = 4330;
function isHexDigit(code) {
  return code >= 48 && code <= 57 || code >= 65 && code <= 70 || code >= 97 && code <= 102;
}
function decrypt(data, key, discardNumber) {
  if (discardNumber >= data.length) {
    return new Uint8Array(0);
  }
  const c1 = 52845,
    c2 = 22719;
  let r = key | 0,
    i,
    j;
  for (i = 0; i < discardNumber; i++) {
    r = (data[i] + r) * c1 + c2 & (1 << 16) - 1;
  }
  const count = data.length - discardNumber;
  const decrypted = new Uint8Array(count);
  for (i = discardNumber, j = 0; j < count; i++, j++) {
    const value = data[i];
    decrypted[j] = value ^ r >> 8;
    r = (value + r) * c1 + c2 & (1 << 16) - 1;
  }
  return decrypted;
}
function decryptAscii(data, key, discardNumber) {
  const c1 = 52845,
    c2 = 22719;
  let r = key | 0;
  const count = data.length,
    maybeLength = count >>> 1;
  const decrypted = new Uint8Array(maybeLength);
  let i, j;
  for (i = 0, j = 0; i < count; i++) {
    const digit1 = data[i];
    if (!isHexDigit(digit1)) {
      continue;
    }
    i++;
    let digit2;
    while (i < count && !isHexDigit(digit2 = data[i])) {
      i++;
    }
    if (i < count) {
      const value = parseInt(String.fromCharCode(digit1, digit2), 16);
      decrypted[j++] = value ^ r >> 8;
      r = (value + r) * c1 + c2 & (1 << 16) - 1;
    }
  }
  return decrypted.slice(discardNumber, j);
}
function isSpecial(c) {
  return c === 0x2f || c === 0x5b || c === 0x5d || c === 0x7b || c === 0x7d || c === 0x28 || c === 0x29;
}
class Type1Parser {
  constructor(stream, encrypted, seacAnalysisEnabled) {
    if (encrypted) {
      const data = stream.getBytes();
      const isBinary = !((isHexDigit(data[0]) || isWhiteSpace(data[0])) && isHexDigit(data[1]) && isHexDigit(data[2]) && isHexDigit(data[3]) && isHexDigit(data[4]) && isHexDigit(data[5]) && isHexDigit(data[6]) && isHexDigit(data[7]));
      stream = new Stream(isBinary ? decrypt(data, EEXEC_ENCRYPT_KEY, 4) : decryptAscii(data, EEXEC_ENCRYPT_KEY, 4));
    }
    this.seacAnalysisEnabled = !!seacAnalysisEnabled;
    this.stream = stream;
    this.nextChar();
  }
  readNumberArray() {
    this.getToken();
    const array = [];
    while (true) {
      const token = this.getToken();
      if (token === null || token === "]" || token === "}") {
        break;
      }
      array.push(parseFloat(token || 0));
    }
    return array;
  }
  readNumber() {
    const token = this.getToken();
    return parseFloat(token || 0);
  }
  readInt() {
    const token = this.getToken();
    return parseInt(token || 0, 10) | 0;
  }
  readBoolean() {
    const token = this.getToken();
    return token === "true" ? 1 : 0;
  }
  nextChar() {
    return this.currentChar = this.stream.getByte();
  }
  prevChar() {
    this.stream.skip(-2);
    return this.currentChar = this.stream.getByte();
  }
  getToken() {
    let comment = false;
    let ch = this.currentChar;
    while (true) {
      if (ch === -1) {
        return null;
      }
      if (comment) {
        if (ch === 0x0a || ch === 0x0d) {
          comment = false;
        }
      } else if (ch === 0x25) {
        comment = true;
      } else if (!isWhiteSpace(ch)) {
        break;
      }
      ch = this.nextChar();
    }
    if (isSpecial(ch)) {
      this.nextChar();
      return String.fromCharCode(ch);
    }
    let token = "";
    do {
      token += String.fromCharCode(ch);
      ch = this.nextChar();
    } while (ch >= 0 && !isWhiteSpace(ch) && !isSpecial(ch));
    return token;
  }
  readCharStrings(bytes, lenIV) {
    if (lenIV === -1) {
      return bytes;
    }
    return decrypt(bytes, CHAR_STRS_ENCRYPT_KEY, lenIV);
  }
  extractFontProgram(properties) {
    const stream = this.stream;
    const subrs = [],
      charstrings = [];
    const privateData = Object.create(null);
    privateData.lenIV = 4;
    const program = {
      subrs: [],
      charstrings: [],
      properties: {
        privateData
      }
    };
    let token, length, data, lenIV;
    while ((token = this.getToken()) !== null) {
      if (token !== "/") {
        continue;
      }
      token = this.getToken();
      switch (token) {
        case "CharStrings":
          this.getToken();
          this.getToken();
          this.getToken();
          this.getToken();
          while (true) {
            token = this.getToken();
            if (token === null || token === "end") {
              break;
            }
            if (token !== "/") {
              continue;
            }
            const glyph = this.getToken();
            length = this.readInt();
            this.getToken();
            data = length > 0 ? stream.getBytes(length) : new Uint8Array(0);
            lenIV = program.properties.privateData.lenIV;
            const encoded = this.readCharStrings(data, lenIV);
            this.nextChar();
            token = this.getToken();
            if (token === "noaccess") {
              this.getToken();
            } else if (token === "/") {
              this.prevChar();
            }
            charstrings.push({
              glyph,
              encoded
            });
          }
          break;
        case "Subrs":
          this.readInt();
          this.getToken();
          while (this.getToken() === "dup") {
            const index = this.readInt();
            length = this.readInt();
            this.getToken();
            data = length > 0 ? stream.getBytes(length) : new Uint8Array(0);
            lenIV = program.properties.privateData.lenIV;
            const encoded = this.readCharStrings(data, lenIV);
            this.nextChar();
            token = this.getToken();
            if (token === "noaccess") {
              this.getToken();
            }
            subrs[index] = encoded;
          }
          break;
        case "BlueValues":
        case "OtherBlues":
        case "FamilyBlues":
        case "FamilyOtherBlues":
          const blueArray = this.readNumberArray();
          if (blueArray.length > 0 && blueArray.length % 2 === 0 && HINTING_ENABLED) {
            program.properties.privateData[token] = blueArray;
          }
          break;
        case "StemSnapH":
        case "StemSnapV":
          program.properties.privateData[token] = this.readNumberArray();
          break;
        case "StdHW":
        case "StdVW":
          program.properties.privateData[token] = this.readNumberArray()[0];
          break;
        case "BlueShift":
        case "lenIV":
        case "BlueFuzz":
        case "BlueScale":
        case "LanguageGroup":
          program.properties.privateData[token] = this.readNumber();
          break;
        case "ExpansionFactor":
          program.properties.privateData[token] = this.readNumber() || 0.06;
          break;
        case "ForceBold":
          program.properties.privateData[token] = this.readBoolean();
          break;
      }
    }
    for (const {
      encoded,
      glyph
    } of charstrings) {
      const charString = new Type1CharString();
      const error = charString.convert(encoded, subrs, this.seacAnalysisEnabled);
      let output = charString.output;
      if (error) {
        output = [14];
      }
      const charStringObject = {
        glyphName: glyph,
        charstring: output,
        width: charString.width,
        lsb: charString.lsb,
        seac: charString.seac
      };
      if (glyph === ".notdef") {
        program.charstrings.unshift(charStringObject);
      } else {
        program.charstrings.push(charStringObject);
      }
      if (properties.builtInEncoding) {
        const index = properties.builtInEncoding.indexOf(glyph);
        if (index > -1 && properties.widths[index] === undefined && index >= properties.firstChar && index <= properties.lastChar) {
          properties.widths[index] = charString.width;
        }
      }
    }
    return program;
  }
  extractFontHeader(properties) {
    let token;
    while ((token = this.getToken()) !== null) {
      if (token !== "/") {
        continue;
      }
      token = this.getToken();
      switch (token) {
        case "FontMatrix":
          const matrix = this.readNumberArray();
          properties.fontMatrix = matrix;
          break;
        case "Encoding":
          const encodingArg = this.getToken();
          let encoding;
          if (!/^\d+$/.test(encodingArg)) {
            encoding = getEncoding(encodingArg);
          } else {
            encoding = [];
            const size = parseInt(encodingArg, 10) | 0;
            this.getToken();
            for (let j = 0; j < size; j++) {
              token = this.getToken();
              while (token !== "dup" && token !== "def") {
                token = this.getToken();
                if (token === null) {
                  return;
                }
              }
              if (token === "def") {
                break;
              }
              const index = this.readInt();
              this.getToken();
              const glyph = this.getToken();
              encoding[index] = glyph;
              this.getToken();
            }
          }
          properties.builtInEncoding = encoding;
          break;
        case "FontBBox":
          const fontBBox = this.readNumberArray();
          properties.ascent = Math.max(fontBBox[3], fontBBox[1]);
          properties.descent = Math.min(fontBBox[1], fontBBox[3]);
          properties.ascentScaled = true;
          break;
      }
    }
  }
}

;// ./src/core/type1_font.js







function findBlock(streamBytes, signature, startIndex) {
  const streamBytesLength = streamBytes.length;
  const signatureLength = signature.length;
  const scanLength = streamBytesLength - signatureLength;
  let i = startIndex,
    found = false;
  while (i < scanLength) {
    let j = 0;
    while (j < signatureLength && streamBytes[i + j] === signature[j]) {
      j++;
    }
    if (j >= signatureLength) {
      i += j;
      while (i < streamBytesLength && isWhiteSpace(streamBytes[i])) {
        i++;
      }
      found = true;
      break;
    }
    i++;
  }
  return {
    found,
    length: i
  };
}
function getHeaderBlock(stream, suggestedLength) {
  const EEXEC_SIGNATURE = [0x65, 0x65, 0x78, 0x65, 0x63];
  const streamStartPos = stream.pos;
  let headerBytes, headerBytesLength, block;
  try {
    headerBytes = stream.getBytes(suggestedLength);
    headerBytesLength = headerBytes.length;
  } catch {}
  if (headerBytesLength === suggestedLength) {
    block = findBlock(headerBytes, EEXEC_SIGNATURE, suggestedLength - 2 * EEXEC_SIGNATURE.length);
    if (block.found && block.length === suggestedLength) {
      return {
        stream: new Stream(headerBytes),
        length: suggestedLength
      };
    }
  }
  warn('Invalid "Length1" property in Type1 font -- trying to recover.');
  stream.pos = streamStartPos;
  const SCAN_BLOCK_LENGTH = 2048;
  let actualLength;
  while (true) {
    const scanBytes = stream.peekBytes(SCAN_BLOCK_LENGTH);
    block = findBlock(scanBytes, EEXEC_SIGNATURE, 0);
    if (block.length === 0) {
      break;
    }
    stream.pos += block.length;
    if (block.found) {
      actualLength = stream.pos - streamStartPos;
      break;
    }
  }
  stream.pos = streamStartPos;
  if (actualLength) {
    return {
      stream: new Stream(stream.getBytes(actualLength)),
      length: actualLength
    };
  }
  warn('Unable to recover "Length1" property in Type1 font -- using as is.');
  return {
    stream: new Stream(stream.getBytes(suggestedLength)),
    length: suggestedLength
  };
}
function getEexecBlock(stream, suggestedLength) {
  const eexecBytes = stream.getBytes();
  if (eexecBytes.length === 0) {
    throw new FormatError("getEexecBlock - no font program found.");
  }
  return {
    stream: new Stream(eexecBytes),
    length: eexecBytes.length
  };
}
class Type1Font {
  constructor(name, file, properties) {
    const PFB_HEADER_SIZE = 6;
    let headerBlockLength = properties.length1;
    let eexecBlockLength = properties.length2;
    let pfbHeader = file.peekBytes(PFB_HEADER_SIZE);
    const pfbHeaderPresent = pfbHeader[0] === 0x80 && pfbHeader[1] === 0x01;
    if (pfbHeaderPresent) {
      file.skip(PFB_HEADER_SIZE);
      headerBlockLength = pfbHeader[5] << 24 | pfbHeader[4] << 16 | pfbHeader[3] << 8 | pfbHeader[2];
    }
    const headerBlock = getHeaderBlock(file, headerBlockLength);
    const headerBlockParser = new Type1Parser(headerBlock.stream, false, SEAC_ANALYSIS_ENABLED);
    headerBlockParser.extractFontHeader(properties);
    if (pfbHeaderPresent) {
      pfbHeader = file.getBytes(PFB_HEADER_SIZE);
      eexecBlockLength = pfbHeader[5] << 24 | pfbHeader[4] << 16 | pfbHeader[3] << 8 | pfbHeader[2];
    }
    const eexecBlock = getEexecBlock(file, eexecBlockLength);
    const eexecBlockParser = new Type1Parser(eexecBlock.stream, true, SEAC_ANALYSIS_ENABLED);
    const data = eexecBlockParser.extractFontProgram(properties);
    for (const key in data.properties) {
      properties[key] = data.properties[key];
    }
    const charstrings = data.charstrings;
    const type2Charstrings = this.getType2Charstrings(charstrings);
    const subrs = this.getType2Subrs(data.subrs);
    this.charstrings = charstrings;
    this.data = this.wrap(name, type2Charstrings, this.charstrings, subrs, properties);
    this.seacs = this.getSeacs(data.charstrings);
  }
  get numGlyphs() {
    return this.charstrings.length + 1;
  }
  getCharset() {
    const charset = [".notdef"];
    for (const {
      glyphName
    } of this.charstrings) {
      charset.push(glyphName);
    }
    return charset;
  }
  getGlyphMapping(properties) {
    const charstrings = this.charstrings;
    if (properties.composite) {
      const charCodeToGlyphId = Object.create(null);
      for (let glyphId = 0, charstringsLen = charstrings.length; glyphId < charstringsLen; glyphId++) {
        const charCode = properties.cMap.charCodeOf(glyphId);
        charCodeToGlyphId[charCode] = glyphId + 1;
      }
      return charCodeToGlyphId;
    }
    const glyphNames = [".notdef"];
    let builtInEncoding, glyphId;
    for (glyphId = 0; glyphId < charstrings.length; glyphId++) {
      glyphNames.push(charstrings[glyphId].glyphName);
    }
    const encoding = properties.builtInEncoding;
    if (encoding) {
      builtInEncoding = Object.create(null);
      for (const charCode in encoding) {
        glyphId = glyphNames.indexOf(encoding[charCode]);
        if (glyphId >= 0) {
          builtInEncoding[charCode] = glyphId;
        }
      }
    }
    return type1FontGlyphMapping(properties, builtInEncoding, glyphNames);
  }
  hasGlyphId(id) {
    if (id < 0 || id >= this.numGlyphs) {
      return false;
    }
    if (id === 0) {
      return true;
    }
    const glyph = this.charstrings[id - 1];
    return glyph.charstring.length > 0;
  }
  getSeacs(charstrings) {
    const seacMap = [];
    for (let i = 0, ii = charstrings.length; i < ii; i++) {
      const charstring = charstrings[i];
      if (charstring.seac) {
        seacMap[i + 1] = charstring.seac;
      }
    }
    return seacMap;
  }
  getType2Charstrings(type1Charstrings) {
    const type2Charstrings = [];
    for (const type1Charstring of type1Charstrings) {
      type2Charstrings.push(type1Charstring.charstring);
    }
    return type2Charstrings;
  }
  getType2Subrs(type1Subrs) {
    let bias = 0;
    const count = type1Subrs.length;
    if (count < 1133) {
      bias = 107;
    } else if (count < 33769) {
      bias = 1131;
    } else {
      bias = 32768;
    }
    const type2Subrs = [];
    let i;
    for (i = 0; i < bias; i++) {
      type2Subrs.push([0x0b]);
    }
    for (i = 0; i < count; i++) {
      type2Subrs.push(type1Subrs[i]);
    }
    return type2Subrs;
  }
  wrap(name, glyphs, charstrings, subrs, properties) {
    const cff = new CFF();
    cff.header = new CFFHeader(1, 0, 4, 4);
    cff.names = [name];
    const topDict = new CFFTopDict();
    topDict.setByName("version", 391);
    topDict.setByName("Notice", 392);
    topDict.setByName("FullName", 393);
    topDict.setByName("FamilyName", 394);
    topDict.setByName("Weight", 395);
    topDict.setByName("Encoding", null);
    topDict.setByName("FontMatrix", properties.fontMatrix);
    topDict.setByName("FontBBox", properties.bbox);
    topDict.setByName("charset", null);
    topDict.setByName("CharStrings", null);
    topDict.setByName("Private", null);
    cff.topDict = topDict;
    const strings = new CFFStrings();
    strings.add("Version 0.11");
    strings.add("See original notice");
    strings.add(name);
    strings.add(name);
    strings.add("Medium");
    cff.strings = strings;
    cff.globalSubrIndex = new CFFIndex();
    const count = glyphs.length;
    const charsetArray = [".notdef"];
    let i, ii;
    for (i = 0; i < count; i++) {
      const glyphName = charstrings[i].glyphName;
      const index = CFFStandardStrings.indexOf(glyphName);
      if (index === -1) {
        strings.add(glyphName);
      }
      charsetArray.push(glyphName);
    }
    cff.charset = new CFFCharset(false, 0, charsetArray);
    const charStringsIndex = new CFFIndex();
    charStringsIndex.add([0x8b, 0x0e]);
    for (i = 0; i < count; i++) {
      charStringsIndex.add(glyphs[i]);
    }
    cff.charStrings = charStringsIndex;
    const privateDict = new CFFPrivateDict();
    privateDict.setByName("Subrs", null);
    const fields = ["BlueValues", "OtherBlues", "FamilyBlues", "FamilyOtherBlues", "StemSnapH", "StemSnapV", "BlueShift", "BlueFuzz", "BlueScale", "LanguageGroup", "ExpansionFactor", "ForceBold", "StdHW", "StdVW"];
    for (i = 0, ii = fields.length; i < ii; i++) {
      const field = fields[i];
      if (!(field in properties.privateData)) {
        continue;
      }
      const value = properties.privateData[field];
      if (Array.isArray(value)) {
        for (let j = value.length - 1; j > 0; j--) {
          value[j] -= value[j - 1];
        }
      }
      privateDict.setByName(field, value);
    }
    cff.topDict.privateDict = privateDict;
    const subrIndex = new CFFIndex();
    for (i = 0, ii = subrs.length; i < ii; i++) {
      subrIndex.add(subrs[i]);
    }
    privateDict.subrsIndex = subrIndex;
    const compiler = new CFFCompiler(cff);
    return compiler.compile();
  }
}

;// ./src/core/fonts.js





































const PRIVATE_USE_AREAS = [[0xe000, 0xf8ff], [0x100000, 0x10fffd]];
const PDF_GLYPH_SPACE_UNITS = 1000;
const EXPORT_DATA_PROPERTIES = ["ascent", "bbox", "black", "bold", "charProcOperatorList", "cssFontInfo", "data", "defaultVMetrics", "defaultWidth", "descent", "disableFontFace", "fallbackName", "fontExtraProperties", "fontMatrix", "isInvalidPDFjsFont", "isType3Font", "italic", "loadedName", "mimetype", "missingFile", "name", "remeasure", "systemFontInfo", "vertical"];
const EXPORT_DATA_EXTRA_PROPERTIES = ["cMap", "composite", "defaultEncoding", "differences", "isMonospace", "isSerifFont", "isSymbolicFont", "seacMap", "subtype", "toFontChar", "toUnicode", "type", "vmetrics", "widths"];
function adjustWidths(properties) {
  if (!properties.fontMatrix) {
    return;
  }
  if (properties.fontMatrix[0] === FONT_IDENTITY_MATRIX[0]) {
    return;
  }
  const scale = 0.001 / properties.fontMatrix[0];
  const glyphsWidths = properties.widths;
  for (const glyph in glyphsWidths) {
    glyphsWidths[glyph] *= scale;
  }
  properties.defaultWidth *= scale;
}
function adjustTrueTypeToUnicode(properties, isSymbolicFont, nameRecords) {
  if (properties.isInternalFont) {
    return;
  }
  if (properties.hasIncludedToUnicodeMap) {
    return;
  }
  if (properties.hasEncoding) {
    return;
  }
  if (properties.toUnicode instanceof IdentityToUnicodeMap) {
    return;
  }
  if (!isSymbolicFont) {
    return;
  }
  if (nameRecords.length === 0) {
    return;
  }
  if (properties.defaultEncoding === WinAnsiEncoding) {
    return;
  }
  for (const r of nameRecords) {
    if (!isWinNameRecord(r)) {
      return;
    }
  }
  const encoding = WinAnsiEncoding;
  const toUnicode = [],
    glyphsUnicodeMap = getGlyphsUnicode();
  for (const charCode in encoding) {
    const glyphName = encoding[charCode];
    if (glyphName === "") {
      continue;
    }
    const unicode = glyphsUnicodeMap[glyphName];
    if (unicode === undefined) {
      continue;
    }
    toUnicode[charCode] = String.fromCharCode(unicode);
  }
  if (toUnicode.length > 0) {
    properties.toUnicode.amend(toUnicode);
  }
}
function adjustType1ToUnicode(properties, builtInEncoding) {
  if (properties.isInternalFont) {
    return;
  }
  if (properties.hasIncludedToUnicodeMap) {
    return;
  }
  if (builtInEncoding === properties.defaultEncoding) {
    return;
  }
  if (properties.toUnicode instanceof IdentityToUnicodeMap) {
    return;
  }
  const toUnicode = [],
    glyphsUnicodeMap = getGlyphsUnicode();
  for (const charCode in builtInEncoding) {
    if (properties.hasEncoding) {
      if (properties.baseEncodingName || properties.differences[charCode] !== undefined) {
        continue;
      }
    }
    const glyphName = builtInEncoding[charCode];
    const unicode = getUnicodeForGlyph(glyphName, glyphsUnicodeMap);
    if (unicode !== -1) {
      toUnicode[charCode] = String.fromCharCode(unicode);
    }
  }
  if (toUnicode.length > 0) {
    properties.toUnicode.amend(toUnicode);
  }
}
function amendFallbackToUnicode(properties) {
  if (!properties.fallbackToUnicode) {
    return;
  }
  if (properties.toUnicode instanceof IdentityToUnicodeMap) {
    return;
  }
  const toUnicode = [];
  for (const charCode in properties.fallbackToUnicode) {
    if (properties.toUnicode.has(charCode)) {
      continue;
    }
    toUnicode[charCode] = properties.fallbackToUnicode[charCode];
  }
  if (toUnicode.length > 0) {
    properties.toUnicode.amend(toUnicode);
  }
}
class fonts_Glyph {
  constructor(originalCharCode, fontChar, unicode, accent, width, vmetric, operatorListId, isSpace, isInFont) {
    this.originalCharCode = originalCharCode;
    this.fontChar = fontChar;
    this.unicode = unicode;
    this.accent = accent;
    this.width = width;
    this.vmetric = vmetric;
    this.operatorListId = operatorListId;
    this.isSpace = isSpace;
    this.isInFont = isInFont;
  }
  get category() {
    return shadow(this, "category", getCharUnicodeCategory(this.unicode), true);
  }
}
function int16(b0, b1) {
  return (b0 << 8) + b1;
}
function writeSignedInt16(bytes, index, value) {
  bytes[index + 1] = value;
  bytes[index] = value >>> 8;
}
function signedInt16(b0, b1) {
  const value = (b0 << 8) + b1;
  return value & 1 << 15 ? value - 0x10000 : value;
}
function writeUint32(bytes, index, value) {
  bytes[index + 3] = value & 0xff;
  bytes[index + 2] = value >>> 8;
  bytes[index + 1] = value >>> 16;
  bytes[index] = value >>> 24;
}
function int32(b0, b1, b2, b3) {
  return (b0 << 24) + (b1 << 16) + (b2 << 8) + b3;
}
function string16(value) {
  return String.fromCharCode(value >> 8 & 0xff, value & 0xff);
}
function safeString16(value) {
  if (value > 0x7fff) {
    value = 0x7fff;
  } else if (value < -0x8000) {
    value = -0x8000;
  }
  return String.fromCharCode(value >> 8 & 0xff, value & 0xff);
}
function isTrueTypeFile(file) {
  const header = file.peekBytes(4);
  return readUint32(header, 0) === 0x00010000 || bytesToString(header) === "true";
}
function isTrueTypeCollectionFile(file) {
  const header = file.peekBytes(4);
  return bytesToString(header) === "ttcf";
}
function isOpenTypeFile(file) {
  const header = file.peekBytes(4);
  return bytesToString(header) === "OTTO";
}
function isType1File(file) {
  const header = file.peekBytes(2);
  if (header[0] === 0x25 && header[1] === 0x21) {
    return true;
  }
  if (header[0] === 0x80 && header[1] === 0x01) {
    return true;
  }
  return false;
}
function isCFFFile(file) {
  const header = file.peekBytes(4);
  if (header[0] >= 1 && header[3] >= 1 && header[3] <= 4) {
    return true;
  }
  return false;
}
function getFontFileType(file, {
  type,
  subtype,
  composite
}) {
  let fileType, fileSubtype;
  if (isTrueTypeFile(file) || isTrueTypeCollectionFile(file)) {
    fileType = composite ? "CIDFontType2" : "TrueType";
  } else if (isOpenTypeFile(file)) {
    fileType = composite ? "CIDFontType2" : "OpenType";
  } else if (isType1File(file)) {
    if (composite) {
      fileType = "CIDFontType0";
    } else {
      fileType = type === "MMType1" ? "MMType1" : "Type1";
    }
  } else if (isCFFFile(file)) {
    if (composite) {
      fileType = "CIDFontType0";
      fileSubtype = "CIDFontType0C";
    } else {
      fileType = type === "MMType1" ? "MMType1" : "Type1";
      fileSubtype = "Type1C";
    }
  } else {
    warn("getFontFileType: Unable to detect correct font file Type/Subtype.");
    fileType = type;
    fileSubtype = subtype;
  }
  return [fileType, fileSubtype];
}
function applyStandardFontGlyphMap(map, glyphMap) {
  for (const charCode in glyphMap) {
    map[+charCode] = glyphMap[charCode];
  }
}
function buildToFontChar(encoding, glyphsUnicodeMap, differences) {
  const toFontChar = [];
  let unicode;
  for (let i = 0, ii = encoding.length; i < ii; i++) {
    unicode = getUnicodeForGlyph(encoding[i], glyphsUnicodeMap);
    if (unicode !== -1) {
      toFontChar[i] = unicode;
    }
  }
  for (const charCode in differences) {
    unicode = getUnicodeForGlyph(differences[charCode], glyphsUnicodeMap);
    if (unicode !== -1) {
      toFontChar[+charCode] = unicode;
    }
  }
  return toFontChar;
}
function isMacNameRecord(r) {
  return r.platform === 1 && r.encoding === 0 && r.language === 0;
}
function isWinNameRecord(r) {
  return r.platform === 3 && r.encoding === 1 && r.language === 0x409;
}
function convertCidString(charCode, cid, shouldThrow = false) {
  switch (cid.length) {
    case 1:
      return cid.charCodeAt(0);
    case 2:
      return cid.charCodeAt(0) << 8 | cid.charCodeAt(1);
  }
  const msg = `Unsupported CID string (charCode ${charCode}): "${cid}".`;
  if (shouldThrow) {
    throw new FormatError(msg);
  }
  warn(msg);
  return cid;
}
function adjustMapping(charCodeToGlyphId, hasGlyph, newGlyphZeroId, toUnicode) {
  const newMap = Object.create(null);
  const toUnicodeExtraMap = new Map();
  const toFontChar = [];
  const usedGlyphIds = new Set();
  let privateUseAreaIndex = 0;
  const privateUseOffetStart = PRIVATE_USE_AREAS[privateUseAreaIndex][0];
  let nextAvailableFontCharCode = privateUseOffetStart;
  let privateUseOffetEnd = PRIVATE_USE_AREAS[privateUseAreaIndex][1];
  const isInPrivateArea = code => PRIVATE_USE_AREAS[0][0] <= code && code <= PRIVATE_USE_AREAS[0][1] || PRIVATE_USE_AREAS[1][0] <= code && code <= PRIVATE_USE_AREAS[1][1];
  let LIGATURE_TO_UNICODE = null;
  for (const originalCharCode in charCodeToGlyphId) {
    let glyphId = charCodeToGlyphId[originalCharCode];
    if (!hasGlyph(glyphId)) {
      continue;
    }
    if (nextAvailableFontCharCode > privateUseOffetEnd) {
      privateUseAreaIndex++;
      if (privateUseAreaIndex >= PRIVATE_USE_AREAS.length) {
        warn("Ran out of space in font private use area.");
        break;
      }
      nextAvailableFontCharCode = PRIVATE_USE_AREAS[privateUseAreaIndex][0];
      privateUseOffetEnd = PRIVATE_USE_AREAS[privateUseAreaIndex][1];
    }
    const fontCharCode = nextAvailableFontCharCode++;
    if (glyphId === 0) {
      glyphId = newGlyphZeroId;
    }
    let unicode = toUnicode.get(originalCharCode);
    if (typeof unicode === "string") {
      if (unicode.length === 1) {
        unicode = unicode.codePointAt(0);
      } else {
        if (!LIGATURE_TO_UNICODE) {
          LIGATURE_TO_UNICODE = new Map();
          for (let i = 0xfb00; i <= 0xfb4f; i++) {
            const normalized = String.fromCharCode(i).normalize("NFKD");
            if (normalized.length > 1) {
              LIGATURE_TO_UNICODE.set(normalized, i);
            }
          }
        }
        unicode = LIGATURE_TO_UNICODE.get(unicode) || unicode.codePointAt(0);
      }
    }
    if (unicode && !isInPrivateArea(unicode) && !usedGlyphIds.has(glyphId)) {
      toUnicodeExtraMap.set(unicode, glyphId);
      usedGlyphIds.add(glyphId);
    }
    newMap[fontCharCode] = glyphId;
    toFontChar[originalCharCode] = fontCharCode;
  }
  return {
    toFontChar,
    charCodeToGlyphId: newMap,
    toUnicodeExtraMap,
    nextAvailableFontCharCode
  };
}
function getRanges(glyphs, toUnicodeExtraMap, numGlyphs) {
  const codes = [];
  for (const charCode in glyphs) {
    if (glyphs[charCode] >= numGlyphs) {
      continue;
    }
    codes.push({
      fontCharCode: charCode | 0,
      glyphId: glyphs[charCode]
    });
  }
  if (toUnicodeExtraMap) {
    for (const [unicode, glyphId] of toUnicodeExtraMap) {
      if (glyphId >= numGlyphs) {
        continue;
      }
      codes.push({
        fontCharCode: unicode,
        glyphId
      });
    }
  }
  if (codes.length === 0) {
    codes.push({
      fontCharCode: 0,
      glyphId: 0
    });
  }
  codes.sort((a, b) => a.fontCharCode - b.fontCharCode);
  const ranges = [];
  const length = codes.length;
  for (let n = 0; n < length;) {
    const start = codes[n].fontCharCode;
    const codeIndices = [codes[n].glyphId];
    ++n;
    let end = start;
    while (n < length && end + 1 === codes[n].fontCharCode) {
      codeIndices.push(codes[n].glyphId);
      ++end;
      ++n;
      if (end === 0xffff) {
        break;
      }
    }
    ranges.push([start, end, codeIndices]);
  }
  return ranges;
}
function createCmapTable(glyphs, toUnicodeExtraMap, numGlyphs) {
  const ranges = getRanges(glyphs, toUnicodeExtraMap, numGlyphs);
  const numTables = ranges.at(-1)[1] > 0xffff ? 2 : 1;
  let cmap = "\x00\x00" + string16(numTables) + "\x00\x03" + "\x00\x01" + string32(4 + numTables * 8);
  let i, ii, j, jj;
  for (i = ranges.length - 1; i >= 0; --i) {
    if (ranges[i][0] <= 0xffff) {
      break;
    }
  }
  const bmpLength = i + 1;
  if (ranges[i][0] < 0xffff && ranges[i][1] === 0xffff) {
    ranges[i][1] = 0xfffe;
  }
  const trailingRangesCount = ranges[i][1] < 0xffff ? 1 : 0;
  const segCount = bmpLength + trailingRangesCount;
  const searchParams = OpenTypeFileBuilder.getSearchParams(segCount, 2);
  let startCount = "";
  let endCount = "";
  let idDeltas = "";
  let idRangeOffsets = "";
  let glyphsIds = "";
  let bias = 0;
  let range, start, end, codes;
  for (i = 0, ii = bmpLength; i < ii; i++) {
    range = ranges[i];
    start = range[0];
    end = range[1];
    startCount += string16(start);
    endCount += string16(end);
    codes = range[2];
    let contiguous = true;
    for (j = 1, jj = codes.length; j < jj; ++j) {
      if (codes[j] !== codes[j - 1] + 1) {
        contiguous = false;
        break;
      }
    }
    if (!contiguous) {
      const offset = (segCount - i) * 2 + bias * 2;
      bias += end - start + 1;
      idDeltas += string16(0);
      idRangeOffsets += string16(offset);
      for (j = 0, jj = codes.length; j < jj; ++j) {
        glyphsIds += string16(codes[j]);
      }
    } else {
      const startCode = codes[0];
      idDeltas += string16(startCode - start & 0xffff);
      idRangeOffsets += string16(0);
    }
  }
  if (trailingRangesCount > 0) {
    endCount += "\xFF\xFF";
    startCount += "\xFF\xFF";
    idDeltas += "\x00\x01";
    idRangeOffsets += "\x00\x00";
  }
  const format314 = "\x00\x00" + string16(2 * segCount) + string16(searchParams.range) + string16(searchParams.entry) + string16(searchParams.rangeShift) + endCount + "\x00\x00" + startCount + idDeltas + idRangeOffsets + glyphsIds;
  let format31012 = "";
  let header31012 = "";
  if (numTables > 1) {
    cmap += "\x00\x03" + "\x00\x0A" + string32(4 + numTables * 8 + 4 + format314.length);
    format31012 = "";
    for (i = 0, ii = ranges.length; i < ii; i++) {
      range = ranges[i];
      start = range[0];
      codes = range[2];
      let code = codes[0];
      for (j = 1, jj = codes.length; j < jj; ++j) {
        if (codes[j] !== codes[j - 1] + 1) {
          end = range[0] + j - 1;
          format31012 += string32(start) + string32(end) + string32(code);
          start = end + 1;
          code = codes[j];
        }
      }
      format31012 += string32(start) + string32(range[1]) + string32(code);
    }
    header31012 = "\x00\x0C" + "\x00\x00" + string32(format31012.length + 16) + "\x00\x00\x00\x00" + string32(format31012.length / 12);
  }
  return cmap + "\x00\x04" + string16(format314.length + 4) + format314 + header31012 + format31012;
}
function validateOS2Table(os2, file) {
  file.pos = (file.start || 0) + os2.offset;
  const version = file.getUint16();
  file.skip(60);
  const selection = file.getUint16();
  if (version < 4 && selection & 0x0300) {
    return false;
  }
  const firstChar = file.getUint16();
  const lastChar = file.getUint16();
  if (firstChar > lastChar) {
    return false;
  }
  file.skip(6);
  const usWinAscent = file.getUint16();
  if (usWinAscent === 0) {
    return false;
  }
  os2.data[8] = os2.data[9] = 0;
  return true;
}
function createOS2Table(properties, charstrings, override) {
  override ||= {
    unitsPerEm: 0,
    yMax: 0,
    yMin: 0,
    ascent: 0,
    descent: 0
  };
  let ulUnicodeRange1 = 0;
  let ulUnicodeRange2 = 0;
  let ulUnicodeRange3 = 0;
  let ulUnicodeRange4 = 0;
  let firstCharIndex = null;
  let lastCharIndex = 0;
  let position = -1;
  if (charstrings) {
    for (let code in charstrings) {
      code |= 0;
      if (firstCharIndex > code || !firstCharIndex) {
        firstCharIndex = code;
      }
      if (lastCharIndex < code) {
        lastCharIndex = code;
      }
      position = getUnicodeRangeFor(code, position);
      if (position < 32) {
        ulUnicodeRange1 |= 1 << position;
      } else if (position < 64) {
        ulUnicodeRange2 |= 1 << position - 32;
      } else if (position < 96) {
        ulUnicodeRange3 |= 1 << position - 64;
      } else if (position < 123) {
        ulUnicodeRange4 |= 1 << position - 96;
      } else {
        throw new FormatError("Unicode ranges Bits > 123 are reserved for internal usage");
      }
    }
    if (lastCharIndex > 0xffff) {
      lastCharIndex = 0xffff;
    }
  } else {
    firstCharIndex = 0;
    lastCharIndex = 255;
  }
  const bbox = properties.bbox || [0, 0, 0, 0];
  const unitsPerEm = override.unitsPerEm || (properties.fontMatrix ? 1 / Math.max(...properties.fontMatrix.slice(0, 4).map(Math.abs)) : 1000);
  const scale = properties.ascentScaled ? 1.0 : unitsPerEm / PDF_GLYPH_SPACE_UNITS;
  const typoAscent = override.ascent || Math.round(scale * (properties.ascent || bbox[3]));
  let typoDescent = override.descent || Math.round(scale * (properties.descent || bbox[1]));
  if (typoDescent > 0 && properties.descent > 0 && bbox[1] < 0) {
    typoDescent = -typoDescent;
  }
  const winAscent = override.yMax || typoAscent;
  const winDescent = -override.yMin || -typoDescent;
  return "\x00\x03" + "\x02\x24" + "\x01\xF4" + "\x00\x05" + "\x00\x00" + "\x02\x8A" + "\x02\xBB" + "\x00\x00" + "\x00\x8C" + "\x02\x8A" + "\x02\xBB" + "\x00\x00" + "\x01\xDF" + "\x00\x31" + "\x01\x02" + "\x00\x00" + "\x00\x00\x06" + String.fromCharCode(properties.fixedPitch ? 0x09 : 0x00) + "\x00\x00\x00\x00\x00\x00" + string32(ulUnicodeRange1) + string32(ulUnicodeRange2) + string32(ulUnicodeRange3) + string32(ulUnicodeRange4) + "\x2A\x32\x31\x2A" + string16(properties.italicAngle ? 1 : 0) + string16(firstCharIndex || properties.firstChar) + string16(lastCharIndex || properties.lastChar) + string16(typoAscent) + string16(typoDescent) + "\x00\x64" + string16(winAscent) + string16(winDescent) + "\x00\x00\x00\x00" + "\x00\x00\x00\x00" + string16(properties.xHeight) + string16(properties.capHeight) + string16(0) + string16(firstCharIndex || properties.firstChar) + "\x00\x03";
}
function createPostTable(properties) {
  const angle = Math.floor(properties.italicAngle * 2 ** 16);
  return "\x00\x03\x00\x00" + string32(angle) + "\x00\x00" + "\x00\x00" + string32(properties.fixedPitch ? 1 : 0) + "\x00\x00\x00\x00" + "\x00\x00\x00\x00" + "\x00\x00\x00\x00" + "\x00\x00\x00\x00";
}
function createPostscriptName(name) {
  return name.replaceAll(/[^\x21-\x7E]|[[\](){}<>/%]/g, "").slice(0, 63);
}
function createNameTable(name, proto) {
  if (!proto) {
    proto = [[], []];
  }
  const strings = [proto[0][0] || "Original licence", proto[0][1] || name, proto[0][2] || "Unknown", proto[0][3] || "uniqueID", proto[0][4] || name, proto[0][5] || "Version 0.11", proto[0][6] || createPostscriptName(name), proto[0][7] || "Unknown", proto[0][8] || "Unknown", proto[0][9] || "Unknown"];
  const stringsUnicode = [];
  let i, ii, j, jj, str;
  for (i = 0, ii = strings.length; i < ii; i++) {
    str = proto[1][i] || strings[i];
    const strBufUnicode = [];
    for (j = 0, jj = str.length; j < jj; j++) {
      strBufUnicode.push(string16(str.charCodeAt(j)));
    }
    stringsUnicode.push(strBufUnicode.join(""));
  }
  const names = [strings, stringsUnicode];
  const platforms = ["\x00\x01", "\x00\x03"];
  const encodings = ["\x00\x00", "\x00\x01"];
  const languages = ["\x00\x00", "\x04\x09"];
  const namesRecordCount = strings.length * platforms.length;
  let nameTable = "\x00\x00" + string16(namesRecordCount) + string16(namesRecordCount * 12 + 6);
  let strOffset = 0;
  for (i = 0, ii = platforms.length; i < ii; i++) {
    const strs = names[i];
    for (j = 0, jj = strs.length; j < jj; j++) {
      str = strs[j];
      const nameRecord = platforms[i] + encodings[i] + languages[i] + string16(j) + string16(str.length) + string16(strOffset);
      nameTable += nameRecord;
      strOffset += str.length;
    }
  }
  nameTable += strings.join("") + stringsUnicode.join("");
  return nameTable;
}
class Font {
  constructor(name, file, properties, evaluatorOptions) {
    this.name = name;
    this.psName = null;
    this.mimetype = null;
    this.disableFontFace = evaluatorOptions.disableFontFace;
    this.fontExtraProperties = evaluatorOptions.fontExtraProperties;
    this.loadedName = properties.loadedName;
    this.isType3Font = properties.isType3Font;
    this.missingFile = false;
    this.cssFontInfo = properties.cssFontInfo;
    this._charsCache = Object.create(null);
    this._glyphCache = Object.create(null);
    let isSerifFont = !!(properties.flags & FontFlags.Serif);
    if (!isSerifFont && !properties.isSimulatedFlags) {
      const baseName = name.replaceAll(/[,_]/g, "-").split("-", 1)[0],
        serifFonts = getSerifFonts();
      for (const namePart of baseName.split("+")) {
        if (serifFonts[namePart]) {
          isSerifFont = true;
          break;
        }
      }
    }
    this.isSerifFont = isSerifFont;
    this.isSymbolicFont = !!(properties.flags & FontFlags.Symbolic);
    this.isMonospace = !!(properties.flags & FontFlags.FixedPitch);
    let {
      type,
      subtype
    } = properties;
    this.type = type;
    this.subtype = subtype;
    this.systemFontInfo = properties.systemFontInfo;
    const matches = name.match(/^InvalidPDFjsFont_(.*)_\d+$/);
    this.isInvalidPDFjsFont = !!matches;
    if (this.isInvalidPDFjsFont) {
      this.fallbackName = matches[1];
    } else if (this.isMonospace) {
      this.fallbackName = "monospace";
    } else if (this.isSerifFont) {
      this.fallbackName = "serif";
    } else {
      this.fallbackName = "sans-serif";
    }
    if (this.systemFontInfo?.guessFallback) {
      this.systemFontInfo.guessFallback = false;
      this.systemFontInfo.css += `,${this.fallbackName}`;
    }
    this.differences = properties.differences;
    this.widths = properties.widths;
    this.defaultWidth = properties.defaultWidth;
    this.composite = properties.composite;
    this.cMap = properties.cMap;
    this.capHeight = properties.capHeight / PDF_GLYPH_SPACE_UNITS;
    this.ascent = properties.ascent / PDF_GLYPH_SPACE_UNITS;
    this.descent = properties.descent / PDF_GLYPH_SPACE_UNITS;
    this.lineHeight = this.ascent - this.descent;
    this.fontMatrix = properties.fontMatrix;
    this.bbox = properties.bbox;
    this.defaultEncoding = properties.defaultEncoding;
    this.toUnicode = properties.toUnicode;
    this.toFontChar = [];
    if (properties.type === "Type3") {
      for (let charCode = 0; charCode < 256; charCode++) {
        this.toFontChar[charCode] = this.differences[charCode] || properties.defaultEncoding[charCode];
      }
      return;
    }
    this.cidEncoding = properties.cidEncoding || "";
    this.vertical = !!properties.vertical;
    if (this.vertical) {
      this.vmetrics = properties.vmetrics;
      this.defaultVMetrics = properties.defaultVMetrics;
    }
    if (!file || file.isEmpty) {
      if (file) {
        warn('Font file is empty in "' + name + '" (' + this.loadedName + ")");
      }
      this.fallbackToSystemFont(properties);
      return;
    }
    [type, subtype] = getFontFileType(file, properties);
    if (type !== this.type || subtype !== this.subtype) {
      info("Inconsistent font file Type/SubType, expected: " + `${this.type}/${this.subtype} but found: ${type}/${subtype}.`);
    }
    let data;
    try {
      switch (type) {
        case "MMType1":
          info("MMType1 font (" + name + "), falling back to Type1.");
        case "Type1":
        case "CIDFontType0":
          this.mimetype = "font/opentype";
          const cff = subtype === "Type1C" || subtype === "CIDFontType0C" ? new CFFFont(file, properties) : new Type1Font(name, file, properties);
          adjustWidths(properties);
          data = this.convert(name, cff, properties);
          break;
        case "OpenType":
        case "TrueType":
        case "CIDFontType2":
          this.mimetype = "font/opentype";
          data = this.checkAndRepair(name, file, properties);
          adjustWidths(properties);
          if (this.isOpenType) {
            type = "OpenType";
          }
          break;
        default:
          throw new FormatError(`Font ${type} is not supported`);
      }
    } catch (e) {
      warn(e);
      this.fallbackToSystemFont(properties);
      return;
    }
    amendFallbackToUnicode(properties);
    this.data = data;
    this.type = type;
    this.subtype = subtype;
    this.fontMatrix = properties.fontMatrix;
    this.widths = properties.widths;
    this.defaultWidth = properties.defaultWidth;
    this.toUnicode = properties.toUnicode;
    this.seacMap = properties.seacMap;
  }
  get renderer() {
    const renderer = FontRendererFactory.create(this, SEAC_ANALYSIS_ENABLED);
    return shadow(this, "renderer", renderer);
  }
  exportData() {
    const exportDataProps = this.fontExtraProperties ? [...EXPORT_DATA_PROPERTIES, ...EXPORT_DATA_EXTRA_PROPERTIES] : EXPORT_DATA_PROPERTIES;
    const data = Object.create(null);
    for (const prop of exportDataProps) {
      const value = this[prop];
      if (value !== undefined) {
        data[prop] = value;
      }
    }
    return data;
  }
  fallbackToSystemFont(properties) {
    this.missingFile = true;
    const {
      name,
      type
    } = this;
    let fontName = normalizeFontName(name);
    const stdFontMap = getStdFontMap(),
      nonStdFontMap = getNonStdFontMap();
    const isStandardFont = !!stdFontMap[fontName];
    const isMappedToStandardFont = !!(nonStdFontMap[fontName] && stdFontMap[nonStdFontMap[fontName]]);
    fontName = stdFontMap[fontName] || nonStdFontMap[fontName] || fontName;
    const fontBasicMetricsMap = getFontBasicMetrics();
    const metrics = fontBasicMetricsMap[fontName];
    if (metrics) {
      if (isNaN(this.ascent)) {
        this.ascent = metrics.ascent / PDF_GLYPH_SPACE_UNITS;
      }
      if (isNaN(this.descent)) {
        this.descent = metrics.descent / PDF_GLYPH_SPACE_UNITS;
      }
      if (isNaN(this.capHeight)) {
        this.capHeight = metrics.capHeight / PDF_GLYPH_SPACE_UNITS;
      }
    }
    this.bold = /bold/gi.test(fontName);
    this.italic = /oblique|italic/gi.test(fontName);
    this.black = /Black/g.test(name);
    const isNarrow = /Narrow/g.test(name);
    this.remeasure = (!isStandardFont || isNarrow) && Object.keys(this.widths).length > 0;
    if ((isStandardFont || isMappedToStandardFont) && type === "CIDFontType2" && this.cidEncoding.startsWith("Identity-")) {
      const cidToGidMap = properties.cidToGidMap;
      const map = [];
      applyStandardFontGlyphMap(map, getGlyphMapForStandardFonts());
      if (/Arial-?Black/i.test(name)) {
        applyStandardFontGlyphMap(map, getSupplementalGlyphMapForArialBlack());
      } else if (/Calibri/i.test(name)) {
        applyStandardFontGlyphMap(map, getSupplementalGlyphMapForCalibri());
      }
      if (cidToGidMap) {
        for (const charCode in map) {
          const cid = map[charCode];
          if (cidToGidMap[cid] !== undefined) {
            map[+charCode] = cidToGidMap[cid];
          }
        }
        if (cidToGidMap.length !== this.toUnicode.length && properties.hasIncludedToUnicodeMap && this.toUnicode instanceof IdentityToUnicodeMap) {
          this.toUnicode.forEach(function (charCode, unicodeCharCode) {
            const cid = map[charCode];
            if (cidToGidMap[cid] === undefined) {
              map[+charCode] = unicodeCharCode;
            }
          });
        }
      }
      if (!(this.toUnicode instanceof IdentityToUnicodeMap)) {
        this.toUnicode.forEach(function (charCode, unicodeCharCode) {
          map[+charCode] = unicodeCharCode;
        });
      }
      this.toFontChar = map;
      this.toUnicode = new ToUnicodeMap(map);
    } else if (/Symbol/i.test(fontName)) {
      this.toFontChar = buildToFontChar(SymbolSetEncoding, getGlyphsUnicode(), this.differences);
    } else if (/Dingbats/i.test(fontName)) {
      this.toFontChar = buildToFontChar(ZapfDingbatsEncoding, getDingbatsGlyphsUnicode(), this.differences);
    } else if (isStandardFont || isMappedToStandardFont) {
      const map = buildToFontChar(this.defaultEncoding, getGlyphsUnicode(), this.differences);
      if (type === "CIDFontType2" && !this.cidEncoding.startsWith("Identity-") && !(this.toUnicode instanceof IdentityToUnicodeMap)) {
        this.toUnicode.forEach(function (charCode, unicodeCharCode) {
          map[+charCode] = unicodeCharCode;
        });
      }
      this.toFontChar = map;
    } else {
      const glyphsUnicodeMap = getGlyphsUnicode();
      const map = [];
      this.toUnicode.forEach((charCode, unicodeCharCode) => {
        if (!this.composite) {
          const glyphName = this.differences[charCode] || this.defaultEncoding[charCode];
          const unicode = getUnicodeForGlyph(glyphName, glyphsUnicodeMap);
          if (unicode !== -1) {
            unicodeCharCode = unicode;
          }
        }
        map[+charCode] = unicodeCharCode;
      });
      if (this.composite && this.toUnicode instanceof IdentityToUnicodeMap) {
        if (/Tahoma|Verdana/i.test(name)) {
          applyStandardFontGlyphMap(map, getGlyphMapForStandardFonts());
        }
      }
      this.toFontChar = map;
    }
    amendFallbackToUnicode(properties);
    this.loadedName = fontName.split("-", 1)[0];
  }
  checkAndRepair(name, font, properties) {
    const VALID_TABLES = ["OS/2", "cmap", "head", "hhea", "hmtx", "maxp", "name", "post", "loca", "glyf", "fpgm", "prep", "cvt ", "CFF "];
    function readTables(file, numTables) {
      const tables = Object.create(null);
      tables["OS/2"] = null;
      tables.cmap = null;
      tables.head = null;
      tables.hhea = null;
      tables.hmtx = null;
      tables.maxp = null;
      tables.name = null;
      tables.post = null;
      for (let i = 0; i < numTables; i++) {
        const table = readTableEntry(file);
        if (!VALID_TABLES.includes(table.tag)) {
          continue;
        }
        if (table.length === 0) {
          continue;
        }
        tables[table.tag] = table;
      }
      return tables;
    }
    function readTableEntry(file) {
      const tag = file.getString(4);
      const checksum = file.getInt32() >>> 0;
      const offset = file.getInt32() >>> 0;
      const length = file.getInt32() >>> 0;
      const previousPosition = file.pos;
      file.pos = file.start || 0;
      file.skip(offset);
      const data = file.getBytes(length);
      file.pos = previousPosition;
      if (tag === "head") {
        data[8] = data[9] = data[10] = data[11] = 0;
        data[17] |= 0x20;
      }
      return {
        tag,
        checksum,
        length,
        offset,
        data
      };
    }
    function readOpenTypeHeader(ttf) {
      return {
        version: ttf.getString(4),
        numTables: ttf.getUint16(),
        searchRange: ttf.getUint16(),
        entrySelector: ttf.getUint16(),
        rangeShift: ttf.getUint16()
      };
    }
    function readTrueTypeCollectionHeader(ttc) {
      const ttcTag = ttc.getString(4);
      assert(ttcTag === "ttcf", "Must be a TrueType Collection font.");
      const majorVersion = ttc.getUint16();
      const minorVersion = ttc.getUint16();
      const numFonts = ttc.getInt32() >>> 0;
      const offsetTable = [];
      for (let i = 0; i < numFonts; i++) {
        offsetTable.push(ttc.getInt32() >>> 0);
      }
      const header = {
        ttcTag,
        majorVersion,
        minorVersion,
        numFonts,
        offsetTable
      };
      switch (majorVersion) {
        case 1:
          return header;
        case 2:
          header.dsigTag = ttc.getInt32() >>> 0;
          header.dsigLength = ttc.getInt32() >>> 0;
          header.dsigOffset = ttc.getInt32() >>> 0;
          return header;
      }
      throw new FormatError(`Invalid TrueType Collection majorVersion: ${majorVersion}.`);
    }
    function readTrueTypeCollectionData(ttc, fontName) {
      const {
        numFonts,
        offsetTable
      } = readTrueTypeCollectionHeader(ttc);
      const fontNameParts = fontName.split("+");
      let fallbackData;
      for (let i = 0; i < numFonts; i++) {
        ttc.pos = (ttc.start || 0) + offsetTable[i];
        const potentialHeader = readOpenTypeHeader(ttc);
        const potentialTables = readTables(ttc, potentialHeader.numTables);
        if (!potentialTables.name) {
          throw new FormatError('TrueType Collection font must contain a "name" table.');
        }
        const [nameTable] = readNameTable(potentialTables.name);
        for (let j = 0, jj = nameTable.length; j < jj; j++) {
          for (let k = 0, kk = nameTable[j].length; k < kk; k++) {
            const nameEntry = nameTable[j][k]?.replaceAll(/\s/g, "");
            if (!nameEntry) {
              continue;
            }
            if (nameEntry === fontName) {
              return {
                header: potentialHeader,
                tables: potentialTables
              };
            }
            if (fontNameParts.length < 2) {
              continue;
            }
            for (const part of fontNameParts) {
              if (nameEntry === part) {
                fallbackData = {
                  name: part,
                  header: potentialHeader,
                  tables: potentialTables
                };
              }
            }
          }
        }
      }
      if (fallbackData) {
        warn(`TrueType Collection does not contain "${fontName}" font, ` + `falling back to "${fallbackData.name}" font instead.`);
        return {
          header: fallbackData.header,
          tables: fallbackData.tables
        };
      }
      throw new FormatError(`TrueType Collection does not contain "${fontName}" font.`);
    }
    function readCmapTable(cmap, file, isSymbolicFont, hasEncoding) {
      if (!cmap) {
        warn("No cmap table available.");
        return {
          platformId: -1,
          encodingId: -1,
          mappings: [],
          hasShortCmap: false
        };
      }
      let segment;
      let start = (file.start || 0) + cmap.offset;
      file.pos = start;
      file.skip(2);
      const numTables = file.getUint16();
      let potentialTable;
      let canBreak = false;
      for (let i = 0; i < numTables; i++) {
        const platformId = file.getUint16();
        const encodingId = file.getUint16();
        const offset = file.getInt32() >>> 0;
        let useTable = false;
        if (potentialTable?.platformId === platformId && potentialTable?.encodingId === encodingId) {
          continue;
        }
        if (platformId === 0 && (encodingId === 0 || encodingId === 1 || encodingId === 3)) {
          useTable = true;
        } else if (platformId === 1 && encodingId === 0) {
          useTable = true;
        } else if (platformId === 3 && encodingId === 1 && (hasEncoding || !potentialTable)) {
          useTable = true;
          if (!isSymbolicFont) {
            canBreak = true;
          }
        } else if (isSymbolicFont && platformId === 3 && encodingId === 0) {
          useTable = true;
          let correctlySorted = true;
          if (i < numTables - 1) {
            const nextBytes = file.peekBytes(2),
              nextPlatformId = int16(nextBytes[0], nextBytes[1]);
            if (nextPlatformId < platformId) {
              correctlySorted = false;
            }
          }
          if (correctlySorted) {
            canBreak = true;
          }
        }
        if (useTable) {
          potentialTable = {
            platformId,
            encodingId,
            offset
          };
        }
        if (canBreak) {
          break;
        }
      }
      if (potentialTable) {
        file.pos = start + potentialTable.offset;
      }
      if (!potentialTable || file.peekByte() === -1) {
        warn("Could not find a preferred cmap table.");
        return {
          platformId: -1,
          encodingId: -1,
          mappings: [],
          hasShortCmap: false
        };
      }
      const format = file.getUint16();
      let hasShortCmap = false;
      const mappings = [];
      let j, glyphId;
      if (format === 0) {
        file.skip(2 + 2);
        for (j = 0; j < 256; j++) {
          const index = file.getByte();
          if (!index) {
            continue;
          }
          mappings.push({
            charCode: j,
            glyphId: index
          });
        }
        hasShortCmap = true;
      } else if (format === 2) {
        file.skip(2 + 2);
        const subHeaderKeys = [];
        let maxSubHeaderKey = 0;
        for (let i = 0; i < 256; i++) {
          const subHeaderKey = file.getUint16() >> 3;
          subHeaderKeys.push(subHeaderKey);
          maxSubHeaderKey = Math.max(subHeaderKey, maxSubHeaderKey);
        }
        const subHeaders = [];
        for (let i = 0; i <= maxSubHeaderKey; i++) {
          subHeaders.push({
            firstCode: file.getUint16(),
            entryCount: file.getUint16(),
            idDelta: signedInt16(file.getByte(), file.getByte()),
            idRangePos: file.pos + file.getUint16()
          });
        }
        for (let i = 0; i < 256; i++) {
          if (subHeaderKeys[i] === 0) {
            file.pos = subHeaders[0].idRangePos + 2 * i;
            glyphId = file.getUint16();
            mappings.push({
              charCode: i,
              glyphId
            });
          } else {
            const s = subHeaders[subHeaderKeys[i]];
            for (j = 0; j < s.entryCount; j++) {
              const charCode = (i << 8) + j + s.firstCode;
              file.pos = s.idRangePos + 2 * j;
              glyphId = file.getUint16();
              if (glyphId !== 0) {
                glyphId = (glyphId + s.idDelta) % 65536;
              }
              mappings.push({
                charCode,
                glyphId
              });
            }
          }
        }
      } else if (format === 4) {
        file.skip(2 + 2);
        const segCount = file.getUint16() >> 1;
        file.skip(6);
        const segments = [];
        let segIndex;
        for (segIndex = 0; segIndex < segCount; segIndex++) {
          segments.push({
            end: file.getUint16()
          });
        }
        file.skip(2);
        for (segIndex = 0; segIndex < segCount; segIndex++) {
          segments[segIndex].start = file.getUint16();
        }
        for (segIndex = 0; segIndex < segCount; segIndex++) {
          segments[segIndex].delta = file.getUint16();
        }
        let offsetsCount = 0,
          offsetIndex;
        for (segIndex = 0; segIndex < segCount; segIndex++) {
          segment = segments[segIndex];
          const rangeOffset = file.getUint16();
          if (!rangeOffset) {
            segment.offsetIndex = -1;
            continue;
          }
          offsetIndex = (rangeOffset >> 1) - (segCount - segIndex);
          segment.offsetIndex = offsetIndex;
          offsetsCount = Math.max(offsetsCount, offsetIndex + segment.end - segment.start + 1);
        }
        const offsets = [];
        for (j = 0; j < offsetsCount; j++) {
          offsets.push(file.getUint16());
        }
        for (segIndex = 0; segIndex < segCount; segIndex++) {
          segment = segments[segIndex];
          start = segment.start;
          const end = segment.end;
          const delta = segment.delta;
          offsetIndex = segment.offsetIndex;
          for (j = start; j <= end; j++) {
            if (j === 0xffff) {
              continue;
            }
            glyphId = offsetIndex < 0 ? j : offsets[offsetIndex + j - start];
            glyphId = glyphId + delta & 0xffff;
            mappings.push({
              charCode: j,
              glyphId
            });
          }
        }
      } else if (format === 6) {
        file.skip(2 + 2);
        const firstCode = file.getUint16();
        const entryCount = file.getUint16();
        for (j = 0; j < entryCount; j++) {
          glyphId = file.getUint16();
          const charCode = firstCode + j;
          mappings.push({
            charCode,
            glyphId
          });
        }
      } else if (format === 12) {
        file.skip(2 + 4 + 4);
        const nGroups = file.getInt32() >>> 0;
        for (j = 0; j < nGroups; j++) {
          const startCharCode = file.getInt32() >>> 0;
          const endCharCode = file.getInt32() >>> 0;
          let glyphCode = file.getInt32() >>> 0;
          for (let charCode = startCharCode; charCode <= endCharCode; charCode++) {
            mappings.push({
              charCode,
              glyphId: glyphCode++
            });
          }
        }
      } else {
        warn("cmap table has unsupported format: " + format);
        return {
          platformId: -1,
          encodingId: -1,
          mappings: [],
          hasShortCmap: false
        };
      }
      mappings.sort((a, b) => a.charCode - b.charCode);
      const finalMappings = [],
        seenCharCodes = new Set();
      for (const map of mappings) {
        const {
          charCode
        } = map;
        if (seenCharCodes.has(charCode)) {
          continue;
        }
        seenCharCodes.add(charCode);
        finalMappings.push(map);
      }
      return {
        platformId: potentialTable.platformId,
        encodingId: potentialTable.encodingId,
        mappings: finalMappings,
        hasShortCmap
      };
    }
    function sanitizeMetrics(file, header, metrics, headTable, numGlyphs, dupFirstEntry) {
      if (!header) {
        if (metrics) {
          metrics.data = null;
        }
        return;
      }
      file.pos = (file.start || 0) + header.offset;
      file.pos += 4;
      file.pos += 2;
      file.pos += 2;
      file.pos += 2;
      file.pos += 2;
      file.pos += 2;
      file.pos += 2;
      file.pos += 2;
      file.pos += 2;
      file.pos += 2;
      const caretOffset = file.getUint16();
      file.pos += 8;
      file.pos += 2;
      let numOfMetrics = file.getUint16();
      if (caretOffset !== 0) {
        const macStyle = int16(headTable.data[44], headTable.data[45]);
        if (!(macStyle & 2)) {
          header.data[22] = 0;
          header.data[23] = 0;
        }
      }
      if (numOfMetrics > numGlyphs) {
        info(`The numOfMetrics (${numOfMetrics}) should not be ` + `greater than the numGlyphs (${numGlyphs}).`);
        numOfMetrics = numGlyphs;
        header.data[34] = (numOfMetrics & 0xff00) >> 8;
        header.data[35] = numOfMetrics & 0x00ff;
      }
      const numOfSidebearings = numGlyphs - numOfMetrics;
      const numMissing = numOfSidebearings - (metrics.length - numOfMetrics * 4 >> 1);
      if (numMissing > 0) {
        const entries = new Uint8Array(metrics.length + numMissing * 2);
        entries.set(metrics.data);
        if (dupFirstEntry) {
          entries[metrics.length] = metrics.data[2];
          entries[metrics.length + 1] = metrics.data[3];
        }
        metrics.data = entries;
      }
    }
    function sanitizeGlyph(source, sourceStart, sourceEnd, dest, destStart, hintsValid) {
      const glyphProfile = {
        length: 0,
        sizeOfInstructions: 0
      };
      if (sourceStart < 0 || sourceStart >= source.length || sourceEnd > source.length || sourceEnd - sourceStart <= 12) {
        return glyphProfile;
      }
      const glyf = source.subarray(sourceStart, sourceEnd);
      const xMin = signedInt16(glyf[2], glyf[3]);
      const yMin = signedInt16(glyf[4], glyf[5]);
      const xMax = signedInt16(glyf[6], glyf[7]);
      const yMax = signedInt16(glyf[8], glyf[9]);
      if (xMin > xMax) {
        writeSignedInt16(glyf, 2, xMax);
        writeSignedInt16(glyf, 6, xMin);
      }
      if (yMin > yMax) {
        writeSignedInt16(glyf, 4, yMax);
        writeSignedInt16(glyf, 8, yMin);
      }
      const contoursCount = signedInt16(glyf[0], glyf[1]);
      if (contoursCount < 0) {
        if (contoursCount < -1) {
          return glyphProfile;
        }
        dest.set(glyf, destStart);
        glyphProfile.length = glyf.length;
        return glyphProfile;
      }
      let i,
        j = 10,
        flagsCount = 0;
      for (i = 0; i < contoursCount; i++) {
        const endPoint = glyf[j] << 8 | glyf[j + 1];
        flagsCount = endPoint + 1;
        j += 2;
      }
      const instructionsStart = j;
      const instructionsLength = glyf[j] << 8 | glyf[j + 1];
      glyphProfile.sizeOfInstructions = instructionsLength;
      j += 2 + instructionsLength;
      const instructionsEnd = j;
      let coordinatesLength = 0;
      for (i = 0; i < flagsCount; i++) {
        const flag = glyf[j++];
        if (flag & 0xc0) {
          glyf[j - 1] = flag & 0x3f;
        }
        let xLength = 2;
        if (flag & 2) {
          xLength = 1;
        } else if (flag & 16) {
          xLength = 0;
        }
        let yLength = 2;
        if (flag & 4) {
          yLength = 1;
        } else if (flag & 32) {
          yLength = 0;
        }
        const xyLength = xLength + yLength;
        coordinatesLength += xyLength;
        if (flag & 8) {
          const repeat = glyf[j++];
          if (repeat === 0) {
            glyf[j - 1] ^= 8;
          }
          i += repeat;
          coordinatesLength += repeat * xyLength;
        }
      }
      if (coordinatesLength === 0) {
        return glyphProfile;
      }
      let glyphDataLength = j + coordinatesLength;
      if (glyphDataLength > glyf.length) {
        return glyphProfile;
      }
      if (!hintsValid && instructionsLength > 0) {
        dest.set(glyf.subarray(0, instructionsStart), destStart);
        dest.set([0, 0], destStart + instructionsStart);
        dest.set(glyf.subarray(instructionsEnd, glyphDataLength), destStart + instructionsStart + 2);
        glyphDataLength -= instructionsLength;
        if (glyf.length - glyphDataLength > 3) {
          glyphDataLength = glyphDataLength + 3 & ~3;
        }
        glyphProfile.length = glyphDataLength;
        return glyphProfile;
      }
      if (glyf.length - glyphDataLength > 3) {
        glyphDataLength = glyphDataLength + 3 & ~3;
        dest.set(glyf.subarray(0, glyphDataLength), destStart);
        glyphProfile.length = glyphDataLength;
        return glyphProfile;
      }
      dest.set(glyf, destStart);
      glyphProfile.length = glyf.length;
      return glyphProfile;
    }
    function sanitizeHead(head, numGlyphs, locaLength) {
      const data = head.data;
      const version = int32(data[0], data[1], data[2], data[3]);
      if (version >> 16 !== 1) {
        info("Attempting to fix invalid version in head table: " + version);
        data[0] = 0;
        data[1] = 1;
        data[2] = 0;
        data[3] = 0;
      }
      const indexToLocFormat = int16(data[50], data[51]);
      if (indexToLocFormat < 0 || indexToLocFormat > 1) {
        info("Attempting to fix invalid indexToLocFormat in head table: " + indexToLocFormat);
        const numGlyphsPlusOne = numGlyphs + 1;
        if (locaLength === numGlyphsPlusOne << 1) {
          data[50] = 0;
          data[51] = 0;
        } else if (locaLength === numGlyphsPlusOne << 2) {
          data[50] = 0;
          data[51] = 1;
        } else {
          throw new FormatError("Could not fix indexToLocFormat: " + indexToLocFormat);
        }
      }
    }
    function sanitizeGlyphLocations(loca, glyf, numGlyphs, isGlyphLocationsLong, hintsValid, dupFirstEntry, maxSizeOfInstructions) {
      let itemSize, itemDecode, itemEncode;
      if (isGlyphLocationsLong) {
        itemSize = 4;
        itemDecode = function fontItemDecodeLong(data, offset) {
          return data[offset] << 24 | data[offset + 1] << 16 | data[offset + 2] << 8 | data[offset + 3];
        };
        itemEncode = function fontItemEncodeLong(data, offset, value) {
          data[offset] = value >>> 24 & 0xff;
          data[offset + 1] = value >> 16 & 0xff;
          data[offset + 2] = value >> 8 & 0xff;
          data[offset + 3] = value & 0xff;
        };
      } else {
        itemSize = 2;
        itemDecode = function fontItemDecode(data, offset) {
          return data[offset] << 9 | data[offset + 1] << 1;
        };
        itemEncode = function fontItemEncode(data, offset, value) {
          data[offset] = value >> 9 & 0xff;
          data[offset + 1] = value >> 1 & 0xff;
        };
      }
      const numGlyphsOut = dupFirstEntry ? numGlyphs + 1 : numGlyphs;
      const locaDataSize = itemSize * (1 + numGlyphsOut);
      const locaData = new Uint8Array(locaDataSize);
      locaData.set(loca.data.subarray(0, locaDataSize));
      loca.data = locaData;
      const oldGlyfData = glyf.data;
      const oldGlyfDataLength = oldGlyfData.length;
      const newGlyfData = new Uint8Array(oldGlyfDataLength);
      let i, j;
      const locaEntries = [];
      for (i = 0, j = 0; i < numGlyphs + 1; i++, j += itemSize) {
        let offset = itemDecode(locaData, j);
        if (offset > oldGlyfDataLength) {
          offset = oldGlyfDataLength;
        }
        locaEntries.push({
          index: i,
          offset,
          endOffset: 0
        });
      }
      locaEntries.sort((a, b) => a.offset - b.offset);
      for (i = 0; i < numGlyphs; i++) {
        locaEntries[i].endOffset = locaEntries[i + 1].offset;
      }
      locaEntries.sort((a, b) => a.index - b.index);
      for (i = 0; i < numGlyphs; i++) {
        const {
          offset,
          endOffset
        } = locaEntries[i];
        if (offset !== 0 || endOffset !== 0) {
          break;
        }
        const nextOffset = locaEntries[i + 1].offset;
        if (nextOffset === 0) {
          continue;
        }
        locaEntries[i].endOffset = nextOffset;
        break;
      }
      const last = locaEntries.at(-2);
      if (last.offset !== 0 && last.endOffset === 0) {
        last.endOffset = oldGlyfDataLength;
      }
      const missingGlyphs = Object.create(null);
      let writeOffset = 0;
      itemEncode(locaData, 0, writeOffset);
      for (i = 0, j = itemSize; i < numGlyphs; i++, j += itemSize) {
        const glyphProfile = sanitizeGlyph(oldGlyfData, locaEntries[i].offset, locaEntries[i].endOffset, newGlyfData, writeOffset, hintsValid);
        const newLength = glyphProfile.length;
        if (newLength === 0) {
          missingGlyphs[i] = true;
        }
        if (glyphProfile.sizeOfInstructions > maxSizeOfInstructions) {
          maxSizeOfInstructions = glyphProfile.sizeOfInstructions;
        }
        writeOffset += newLength;
        itemEncode(locaData, j, writeOffset);
      }
      if (writeOffset === 0) {
        const simpleGlyph = new Uint8Array([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 49, 0]);
        for (i = 0, j = itemSize; i < numGlyphsOut; i++, j += itemSize) {
          itemEncode(locaData, j, simpleGlyph.length);
        }
        glyf.data = simpleGlyph;
      } else if (dupFirstEntry) {
        const firstEntryLength = itemDecode(locaData, itemSize);
        if (newGlyfData.length > firstEntryLength + writeOffset) {
          glyf.data = newGlyfData.subarray(0, firstEntryLength + writeOffset);
        } else {
          glyf.data = new Uint8Array(firstEntryLength + writeOffset);
          glyf.data.set(newGlyfData.subarray(0, writeOffset));
        }
        glyf.data.set(newGlyfData.subarray(0, firstEntryLength), writeOffset);
        itemEncode(loca.data, locaData.length - itemSize, writeOffset + firstEntryLength);
      } else {
        glyf.data = newGlyfData.subarray(0, writeOffset);
      }
      return {
        missingGlyphs,
        maxSizeOfInstructions
      };
    }
    function readPostScriptTable(post, propertiesObj, maxpNumGlyphs) {
      const start = (font.start || 0) + post.offset;
      font.pos = start;
      const length = post.length,
        end = start + length;
      const version = font.getInt32();
      font.skip(28);
      let glyphNames;
      let valid = true;
      let i;
      switch (version) {
        case 0x00010000:
          glyphNames = MacStandardGlyphOrdering;
          break;
        case 0x00020000:
          const numGlyphs = font.getUint16();
          if (numGlyphs !== maxpNumGlyphs) {
            valid = false;
            break;
          }
          const glyphNameIndexes = [];
          for (i = 0; i < numGlyphs; ++i) {
            const index = font.getUint16();
            if (index >= 32768) {
              valid = false;
              break;
            }
            glyphNameIndexes.push(index);
          }
          if (!valid) {
            break;
          }
          const customNames = [],
            strBuf = [];
          while (font.pos < end) {
            const stringLength = font.getByte();
            strBuf.length = stringLength;
            for (i = 0; i < stringLength; ++i) {
              strBuf[i] = String.fromCharCode(font.getByte());
            }
            customNames.push(strBuf.join(""));
          }
          glyphNames = [];
          for (i = 0; i < numGlyphs; ++i) {
            const j = glyphNameIndexes[i];
            if (j < 258) {
              glyphNames.push(MacStandardGlyphOrdering[j]);
              continue;
            }
            glyphNames.push(customNames[j - 258]);
          }
          break;
        case 0x00030000:
          break;
        default:
          warn("Unknown/unsupported post table version " + version);
          valid = false;
          if (propertiesObj.defaultEncoding) {
            glyphNames = propertiesObj.defaultEncoding;
          }
          break;
      }
      propertiesObj.glyphNames = glyphNames;
      return valid;
    }
    function readNameTable(nameTable) {
      const start = (font.start || 0) + nameTable.offset;
      font.pos = start;
      const names = [[], []],
        records = [];
      const length = nameTable.length,
        end = start + length;
      const format = font.getUint16();
      const FORMAT_0_HEADER_LENGTH = 6;
      if (format !== 0 || length < FORMAT_0_HEADER_LENGTH) {
        return [names, records];
      }
      const numRecords = font.getUint16();
      const stringsStart = font.getUint16();
      const NAME_RECORD_LENGTH = 12;
      let i, ii;
      for (i = 0; i < numRecords && font.pos + NAME_RECORD_LENGTH <= end; i++) {
        const r = {
          platform: font.getUint16(),
          encoding: font.getUint16(),
          language: font.getUint16(),
          name: font.getUint16(),
          length: font.getUint16(),
          offset: font.getUint16()
        };
        if (isMacNameRecord(r) || isWinNameRecord(r)) {
          records.push(r);
        }
      }
      for (i = 0, ii = records.length; i < ii; i++) {
        const record = records[i];
        if (record.length <= 0) {
          continue;
        }
        const pos = start + stringsStart + record.offset;
        if (pos + record.length > end) {
          continue;
        }
        font.pos = pos;
        const nameIndex = record.name;
        if (record.encoding) {
          let str = "";
          for (let j = 0, jj = record.length; j < jj; j += 2) {
            str += String.fromCharCode(font.getUint16());
          }
          names[1][nameIndex] = str;
        } else {
          names[0][nameIndex] = font.getString(record.length);
        }
      }
      return [names, records];
    }
    const TTOpsStackDeltas = [0, 0, 0, 0, 0, 0, 0, 0, -2, -2, -2, -2, 0, 0, -2, -5, -1, -1, -1, -1, -1, -1, -1, -1, 0, 0, -1, 0, -1, -1, -1, -1, 1, -1, -999, 0, 1, 0, -1, -2, 0, -1, -2, -1, -1, 0, -1, -1, 0, 0, -999, -999, -1, -1, -1, -1, -2, -999, -2, -2, -999, 0, -2, -2, 0, 0, -2, 0, -2, 0, 0, 0, -2, -1, -1, 1, 1, 0, 0, -1, -1, -1, -1, -1, -1, -1, 0, 0, -1, 0, -1, -1, 0, -999, -1, -1, -1, -1, -1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -2, -999, -999, -999, -999, -999, -1, -1, -2, -2, 0, 0, 0, 0, -1, -1, -999, -2, -2, 0, 0, -1, -2, -2, 0, 0, 0, -1, -1, -1, -2];
    function sanitizeTTProgram(table, ttContext) {
      let data = table.data;
      let i = 0,
        j,
        n,
        b,
        funcId,
        pc,
        lastEndf = 0,
        lastDeff = 0;
      const stack = [];
      const callstack = [];
      const functionsCalled = [];
      let tooComplexToFollowFunctions = ttContext.tooComplexToFollowFunctions;
      let inFDEF = false,
        ifLevel = 0,
        inELSE = 0;
      for (let ii = data.length; i < ii;) {
        const op = data[i++];
        if (op === 0x40) {
          n = data[i++];
          if (inFDEF || inELSE) {
            i += n;
          } else {
            for (j = 0; j < n; j++) {
              stack.push(data[i++]);
            }
          }
        } else if (op === 0x41) {
          n = data[i++];
          if (inFDEF || inELSE) {
            i += n * 2;
          } else {
            for (j = 0; j < n; j++) {
              b = data[i++];
              stack.push(b << 8 | data[i++]);
            }
          }
        } else if ((op & 0xf8) === 0xb0) {
          n = op - 0xb0 + 1;
          if (inFDEF || inELSE) {
            i += n;
          } else {
            for (j = 0; j < n; j++) {
              stack.push(data[i++]);
            }
          }
        } else if ((op & 0xf8) === 0xb8) {
          n = op - 0xb8 + 1;
          if (inFDEF || inELSE) {
            i += n * 2;
          } else {
            for (j = 0; j < n; j++) {
              b = data[i++];
              stack.push(signedInt16(b, data[i++]));
            }
          }
        } else if (op === 0x2b && !tooComplexToFollowFunctions) {
          if (!inFDEF && !inELSE) {
            funcId = stack.at(-1);
            if (isNaN(funcId)) {
              info("TT: CALL empty stack (or invalid entry).");
            } else {
              ttContext.functionsUsed[funcId] = true;
              if (funcId in ttContext.functionsStackDeltas) {
                const newStackLength = stack.length + ttContext.functionsStackDeltas[funcId];
                if (newStackLength < 0) {
                  warn("TT: CALL invalid functions stack delta.");
                  ttContext.hintsValid = false;
                  return;
                }
                stack.length = newStackLength;
              } else if (funcId in ttContext.functionsDefined && !functionsCalled.includes(funcId)) {
                callstack.push({
                  data,
                  i,
                  stackTop: stack.length - 1
                });
                functionsCalled.push(funcId);
                pc = ttContext.functionsDefined[funcId];
                if (!pc) {
                  warn("TT: CALL non-existent function");
                  ttContext.hintsValid = false;
                  return;
                }
                data = pc.data;
                i = pc.i;
              }
            }
          }
        } else if (op === 0x2c && !tooComplexToFollowFunctions) {
          if (inFDEF || inELSE) {
            warn("TT: nested FDEFs not allowed");
            tooComplexToFollowFunctions = true;
          }
          inFDEF = true;
          lastDeff = i;
          funcId = stack.pop();
          ttContext.functionsDefined[funcId] = {
            data,
            i
          };
        } else if (op === 0x2d) {
          if (inFDEF) {
            inFDEF = false;
            lastEndf = i;
          } else {
            pc = callstack.pop();
            if (!pc) {
              warn("TT: ENDF bad stack");
              ttContext.hintsValid = false;
              return;
            }
            funcId = functionsCalled.pop();
            data = pc.data;
            i = pc.i;
            ttContext.functionsStackDeltas[funcId] = stack.length - pc.stackTop;
          }
        } else if (op === 0x89) {
          if (inFDEF || inELSE) {
            warn("TT: nested IDEFs not allowed");
            tooComplexToFollowFunctions = true;
          }
          inFDEF = true;
          lastDeff = i;
        } else if (op === 0x58) {
          ++ifLevel;
        } else if (op === 0x1b) {
          inELSE = ifLevel;
        } else if (op === 0x59) {
          if (inELSE === ifLevel) {
            inELSE = 0;
          }
          --ifLevel;
        } else if (op === 0x1c) {
          if (!inFDEF && !inELSE) {
            const offset = stack.at(-1);
            if (offset > 0) {
              i += offset - 1;
            }
          }
        }
        if (!inFDEF && !inELSE) {
          let stackDelta = 0;
          if (op <= 0x8e) {
            stackDelta = TTOpsStackDeltas[op];
          } else if (op >= 0xc0 && op <= 0xdf) {
            stackDelta = -1;
          } else if (op >= 0xe0) {
            stackDelta = -2;
          }
          if (op >= 0x71 && op <= 0x75) {
            n = stack.pop();
            if (!isNaN(n)) {
              stackDelta = -n * 2;
            }
          }
          while (stackDelta < 0 && stack.length > 0) {
            stack.pop();
            stackDelta++;
          }
          while (stackDelta > 0) {
            stack.push(NaN);
            stackDelta--;
          }
        }
      }
      ttContext.tooComplexToFollowFunctions = tooComplexToFollowFunctions;
      const content = [data];
      if (i > data.length) {
        content.push(new Uint8Array(i - data.length));
      }
      if (lastDeff > lastEndf) {
        warn("TT: complementing a missing function tail");
        content.push(new Uint8Array([0x22, 0x2d]));
      }
      foldTTTable(table, content);
    }
    function checkInvalidFunctions(ttContext, maxFunctionDefs) {
      if (ttContext.tooComplexToFollowFunctions) {
        return;
      }
      if (ttContext.functionsDefined.length > maxFunctionDefs) {
        warn("TT: more functions defined than expected");
        ttContext.hintsValid = false;
        return;
      }
      for (let j = 0, jj = ttContext.functionsUsed.length; j < jj; j++) {
        if (j > maxFunctionDefs) {
          warn("TT: invalid function id: " + j);
          ttContext.hintsValid = false;
          return;
        }
        if (ttContext.functionsUsed[j] && !ttContext.functionsDefined[j]) {
          warn("TT: undefined function: " + j);
          ttContext.hintsValid = false;
          return;
        }
      }
    }
    function foldTTTable(table, content) {
      if (content.length > 1) {
        let newLength = 0;
        let j, jj;
        for (j = 0, jj = content.length; j < jj; j++) {
          newLength += content[j].length;
        }
        newLength = newLength + 3 & ~3;
        const result = new Uint8Array(newLength);
        let pos = 0;
        for (j = 0, jj = content.length; j < jj; j++) {
          result.set(content[j], pos);
          pos += content[j].length;
        }
        table.data = result;
        table.length = newLength;
      }
    }
    function sanitizeTTPrograms(fpgm, prep, cvt, maxFunctionDefs) {
      const ttContext = {
        functionsDefined: [],
        functionsUsed: [],
        functionsStackDeltas: [],
        tooComplexToFollowFunctions: false,
        hintsValid: true
      };
      if (fpgm) {
        sanitizeTTProgram(fpgm, ttContext);
      }
      if (prep) {
        sanitizeTTProgram(prep, ttContext);
      }
      if (fpgm) {
        checkInvalidFunctions(ttContext, maxFunctionDefs);
      }
      if (cvt && cvt.length & 1) {
        const cvtData = new Uint8Array(cvt.length + 1);
        cvtData.set(cvt.data);
        cvt.data = cvtData;
      }
      return ttContext.hintsValid;
    }
    font = new Stream(new Uint8Array(font.getBytes()));
    let header, tables;
    if (isTrueTypeCollectionFile(font)) {
      const ttcData = readTrueTypeCollectionData(font, this.name);
      header = ttcData.header;
      tables = ttcData.tables;
    } else {
      header = readOpenTypeHeader(font);
      tables = readTables(font, header.numTables);
    }
    let cff, cffFile;
    const isTrueType = !tables["CFF "];
    if (!isTrueType) {
      const isComposite = properties.composite && (properties.cidToGidMap?.length > 0 || !(properties.cMap instanceof IdentityCMap));
      if (header.version === "OTTO" && !isComposite || !tables.head || !tables.hhea || !tables.maxp || !tables.post) {
        cffFile = new Stream(tables["CFF "].data);
        cff = new CFFFont(cffFile, properties);
        return this.convert(name, cff, properties);
      }
      delete tables.glyf;
      delete tables.loca;
      delete tables.fpgm;
      delete tables.prep;
      delete tables["cvt "];
      this.isOpenType = true;
    } else {
      if (!tables.loca) {
        throw new FormatError('Required "loca" table is not found');
      }
      if (!tables.glyf) {
        warn('Required "glyf" table is not found -- trying to recover.');
        tables.glyf = {
          tag: "glyf",
          data: new Uint8Array(0)
        };
      }
      this.isOpenType = false;
    }
    if (!tables.maxp) {
      throw new FormatError('Required "maxp" table is not found');
    }
    font.pos = (font.start || 0) + tables.maxp.offset;
    let version = font.getInt32();
    const numGlyphs = font.getUint16();
    if (version !== 0x00010000 && version !== 0x00005000) {
      if (tables.maxp.length === 6) {
        version = 0x0005000;
      } else if (tables.maxp.length >= 32) {
        version = 0x00010000;
      } else {
        throw new FormatError(`"maxp" table has a wrong version number`);
      }
      writeUint32(tables.maxp.data, 0, version);
    }
    if (properties.scaleFactors?.length === numGlyphs && isTrueType) {
      const {
        scaleFactors
      } = properties;
      const isGlyphLocationsLong = int16(tables.head.data[50], tables.head.data[51]);
      const glyphs = new GlyfTable({
        glyfTable: tables.glyf.data,
        isGlyphLocationsLong,
        locaTable: tables.loca.data,
        numGlyphs
      });
      glyphs.scale(scaleFactors);
      const {
        glyf,
        loca,
        isLocationLong
      } = glyphs.write();
      tables.glyf.data = glyf;
      tables.loca.data = loca;
      if (isLocationLong !== !!isGlyphLocationsLong) {
        tables.head.data[50] = 0;
        tables.head.data[51] = isLocationLong ? 1 : 0;
      }
      const metrics = tables.hmtx.data;
      for (let i = 0; i < numGlyphs; i++) {
        const j = 4 * i;
        const advanceWidth = Math.round(scaleFactors[i] * int16(metrics[j], metrics[j + 1]));
        metrics[j] = advanceWidth >> 8 & 0xff;
        metrics[j + 1] = advanceWidth & 0xff;
        const lsb = Math.round(scaleFactors[i] * signedInt16(metrics[j + 2], metrics[j + 3]));
        writeSignedInt16(metrics, j + 2, lsb);
      }
    }
    let numGlyphsOut = numGlyphs + 1;
    let dupFirstEntry = true;
    if (numGlyphsOut > 0xffff) {
      dupFirstEntry = false;
      numGlyphsOut = numGlyphs;
      warn("Not enough space in glyfs to duplicate first glyph.");
    }
    let maxFunctionDefs = 0;
    let maxSizeOfInstructions = 0;
    if (version >= 0x00010000 && tables.maxp.length >= 32) {
      font.pos += 8;
      const maxZones = font.getUint16();
      if (maxZones > 2) {
        tables.maxp.data[14] = 0;
        tables.maxp.data[15] = 2;
      }
      font.pos += 4;
      maxFunctionDefs = font.getUint16();
      font.pos += 4;
      maxSizeOfInstructions = font.getUint16();
    }
    tables.maxp.data[4] = numGlyphsOut >> 8;
    tables.maxp.data[5] = numGlyphsOut & 255;
    const hintsValid = sanitizeTTPrograms(tables.fpgm, tables.prep, tables["cvt "], maxFunctionDefs);
    if (!hintsValid) {
      delete tables.fpgm;
      delete tables.prep;
      delete tables["cvt "];
    }
    sanitizeMetrics(font, tables.hhea, tables.hmtx, tables.head, numGlyphsOut, dupFirstEntry);
    if (!tables.head) {
      throw new FormatError('Required "head" table is not found');
    }
    sanitizeHead(tables.head, numGlyphs, isTrueType ? tables.loca.length : 0);
    let missingGlyphs = Object.create(null);
    if (isTrueType) {
      const isGlyphLocationsLong = int16(tables.head.data[50], tables.head.data[51]);
      const glyphsInfo = sanitizeGlyphLocations(tables.loca, tables.glyf, numGlyphs, isGlyphLocationsLong, hintsValid, dupFirstEntry, maxSizeOfInstructions);
      missingGlyphs = glyphsInfo.missingGlyphs;
      if (version >= 0x00010000 && tables.maxp.length >= 32) {
        tables.maxp.data[26] = glyphsInfo.maxSizeOfInstructions >> 8;
        tables.maxp.data[27] = glyphsInfo.maxSizeOfInstructions & 255;
      }
    }
    if (!tables.hhea) {
      throw new FormatError('Required "hhea" table is not found');
    }
    if (tables.hhea.data[10] === 0 && tables.hhea.data[11] === 0) {
      tables.hhea.data[10] = 0xff;
      tables.hhea.data[11] = 0xff;
    }
    const metricsOverride = {
      unitsPerEm: int16(tables.head.data[18], tables.head.data[19]),
      yMax: signedInt16(tables.head.data[42], tables.head.data[43]),
      yMin: signedInt16(tables.head.data[38], tables.head.data[39]),
      ascent: signedInt16(tables.hhea.data[4], tables.hhea.data[5]),
      descent: signedInt16(tables.hhea.data[6], tables.hhea.data[7]),
      lineGap: signedInt16(tables.hhea.data[8], tables.hhea.data[9])
    };
    this.ascent = metricsOverride.ascent / metricsOverride.unitsPerEm;
    this.descent = metricsOverride.descent / metricsOverride.unitsPerEm;
    this.lineGap = metricsOverride.lineGap / metricsOverride.unitsPerEm;
    if (this.cssFontInfo?.lineHeight) {
      this.lineHeight = this.cssFontInfo.metrics.lineHeight;
      this.lineGap = this.cssFontInfo.metrics.lineGap;
    } else {
      this.lineHeight = this.ascent - this.descent + this.lineGap;
    }
    if (tables.post) {
      readPostScriptTable(tables.post, properties, numGlyphs);
    }
    tables.post = {
      tag: "post",
      data: createPostTable(properties)
    };
    const charCodeToGlyphId = Object.create(null);
    function hasGlyph(glyphId) {
      return !missingGlyphs[glyphId];
    }
    if (properties.composite) {
      const cidToGidMap = properties.cidToGidMap || [];
      const isCidToGidMapEmpty = cidToGidMap.length === 0;
      properties.cMap.forEach(function (charCode, cid) {
        if (typeof cid === "string") {
          cid = convertCidString(charCode, cid, true);
        }
        if (cid > 0xffff) {
          throw new FormatError("Max size of CID is 65,535");
        }
        let glyphId = -1;
        if (isCidToGidMapEmpty) {
          glyphId = cid;
        } else if (cidToGidMap[cid] !== undefined) {
          glyphId = cidToGidMap[cid];
        }
        if (glyphId >= 0 && glyphId < numGlyphs && hasGlyph(glyphId)) {
          charCodeToGlyphId[charCode] = glyphId;
        }
      });
    } else {
      const cmapTable = readCmapTable(tables.cmap, font, this.isSymbolicFont, properties.hasEncoding);
      const cmapPlatformId = cmapTable.platformId;
      const cmapEncodingId = cmapTable.encodingId;
      const cmapMappings = cmapTable.mappings;
      let baseEncoding = [],
        forcePostTable = false;
      if (properties.hasEncoding && (properties.baseEncodingName === "MacRomanEncoding" || properties.baseEncodingName === "WinAnsiEncoding")) {
        baseEncoding = getEncoding(properties.baseEncodingName);
      }
      if (properties.hasEncoding && !this.isSymbolicFont && (cmapPlatformId === 3 && cmapEncodingId === 1 || cmapPlatformId === 1 && cmapEncodingId === 0)) {
        const glyphsUnicodeMap = getGlyphsUnicode();
        for (let charCode = 0; charCode < 256; charCode++) {
          let glyphName;
          if (this.differences[charCode] !== undefined) {
            glyphName = this.differences[charCode];
          } else if (baseEncoding.length && baseEncoding[charCode] !== "") {
            glyphName = baseEncoding[charCode];
          } else {
            glyphName = StandardEncoding[charCode];
          }
          if (!glyphName) {
            continue;
          }
          const standardGlyphName = recoverGlyphName(glyphName, glyphsUnicodeMap);
          let unicodeOrCharCode;
          if (cmapPlatformId === 3 && cmapEncodingId === 1) {
            unicodeOrCharCode = glyphsUnicodeMap[standardGlyphName];
          } else if (cmapPlatformId === 1 && cmapEncodingId === 0) {
            unicodeOrCharCode = MacRomanEncoding.indexOf(standardGlyphName);
          }
          if (unicodeOrCharCode === undefined) {
            if (!properties.glyphNames && properties.hasIncludedToUnicodeMap && !(this.toUnicode instanceof IdentityToUnicodeMap)) {
              const unicode = this.toUnicode.get(charCode);
              if (unicode) {
                unicodeOrCharCode = unicode.codePointAt(0);
              }
            }
            if (unicodeOrCharCode === undefined) {
              continue;
            }
          }
          for (const mapping of cmapMappings) {
            if (mapping.charCode !== unicodeOrCharCode) {
              continue;
            }
            charCodeToGlyphId[charCode] = mapping.glyphId;
            break;
          }
        }
      } else if (cmapPlatformId === 0) {
        for (const mapping of cmapMappings) {
          charCodeToGlyphId[mapping.charCode] = mapping.glyphId;
        }
        forcePostTable = true;
      } else if (cmapPlatformId === 3 && cmapEncodingId === 0) {
        for (const mapping of cmapMappings) {
          let charCode = mapping.charCode;
          if (charCode >= 0xf000 && charCode <= 0xf0ff) {
            charCode &= 0xff;
          }
          charCodeToGlyphId[charCode] = mapping.glyphId;
        }
      } else {
        for (const mapping of cmapMappings) {
          charCodeToGlyphId[mapping.charCode] = mapping.glyphId;
        }
      }
      if (properties.glyphNames && (baseEncoding.length || this.differences.length)) {
        for (let i = 0; i < 256; ++i) {
          if (!forcePostTable && charCodeToGlyphId[i] !== undefined) {
            continue;
          }
          const glyphName = this.differences[i] || baseEncoding[i];
          if (!glyphName) {
            continue;
          }
          const glyphId = properties.glyphNames.indexOf(glyphName);
          if (glyphId > 0 && hasGlyph(glyphId)) {
            charCodeToGlyphId[i] = glyphId;
          }
        }
      }
    }
    if (charCodeToGlyphId.length === 0) {
      charCodeToGlyphId[0] = 0;
    }
    let glyphZeroId = numGlyphsOut - 1;
    if (!dupFirstEntry) {
      glyphZeroId = 0;
    }
    if (!properties.cssFontInfo) {
      const newMapping = adjustMapping(charCodeToGlyphId, hasGlyph, glyphZeroId, this.toUnicode);
      this.toFontChar = newMapping.toFontChar;
      tables.cmap = {
        tag: "cmap",
        data: createCmapTable(newMapping.charCodeToGlyphId, newMapping.toUnicodeExtraMap, numGlyphsOut)
      };
      if (!tables["OS/2"] || !validateOS2Table(tables["OS/2"], font)) {
        tables["OS/2"] = {
          tag: "OS/2",
          data: createOS2Table(properties, newMapping.charCodeToGlyphId, metricsOverride)
        };
      }
    }
    if (!isTrueType) {
      try {
        cffFile = new Stream(tables["CFF "].data);
        const parser = new CFFParser(cffFile, properties, SEAC_ANALYSIS_ENABLED);
        cff = parser.parse();
        cff.duplicateFirstGlyph();
        const compiler = new CFFCompiler(cff);
        tables["CFF "].data = compiler.compile();
      } catch {
        warn("Failed to compile font " + properties.loadedName);
      }
    }
    if (!tables.name) {
      tables.name = {
        tag: "name",
        data: createNameTable(this.name)
      };
    } else {
      const [namePrototype, nameRecords] = readNameTable(tables.name);
      tables.name.data = createNameTable(name, namePrototype);
      this.psName = namePrototype[0][6] || null;
      if (!properties.composite) {
        adjustTrueTypeToUnicode(properties, this.isSymbolicFont, nameRecords);
      }
    }
    const builder = new OpenTypeFileBuilder(header.version);
    for (const tableTag in tables) {
      builder.addTable(tableTag, tables[tableTag].data);
    }
    return builder.toArray();
  }
  convert(fontName, font, properties) {
    properties.fixedPitch = false;
    if (properties.builtInEncoding) {
      adjustType1ToUnicode(properties, properties.builtInEncoding);
    }
    let glyphZeroId = 1;
    if (font instanceof CFFFont) {
      glyphZeroId = font.numGlyphs - 1;
    }
    const mapping = font.getGlyphMapping(properties);
    let newMapping = null;
    let newCharCodeToGlyphId = mapping;
    let toUnicodeExtraMap = null;
    if (!properties.cssFontInfo) {
      newMapping = adjustMapping(mapping, font.hasGlyphId.bind(font), glyphZeroId, this.toUnicode);
      this.toFontChar = newMapping.toFontChar;
      newCharCodeToGlyphId = newMapping.charCodeToGlyphId;
      toUnicodeExtraMap = newMapping.toUnicodeExtraMap;
    }
    const numGlyphs = font.numGlyphs;
    function getCharCodes(charCodeToGlyphId, glyphId) {
      let charCodes = null;
      for (const charCode in charCodeToGlyphId) {
        if (glyphId === charCodeToGlyphId[charCode]) {
          (charCodes ||= []).push(charCode | 0);
        }
      }
      return charCodes;
    }
    function createCharCode(charCodeToGlyphId, glyphId) {
      for (const charCode in charCodeToGlyphId) {
        if (glyphId === charCodeToGlyphId[charCode]) {
          return charCode | 0;
        }
      }
      newMapping.charCodeToGlyphId[newMapping.nextAvailableFontCharCode] = glyphId;
      return newMapping.nextAvailableFontCharCode++;
    }
    const seacs = font.seacs;
    if (newMapping && SEAC_ANALYSIS_ENABLED && seacs?.length) {
      const matrix = properties.fontMatrix || FONT_IDENTITY_MATRIX;
      const charset = font.getCharset();
      const seacMap = Object.create(null);
      for (let glyphId in seacs) {
        glyphId |= 0;
        const seac = seacs[glyphId];
        const baseGlyphName = StandardEncoding[seac[2]];
        const accentGlyphName = StandardEncoding[seac[3]];
        const baseGlyphId = charset.indexOf(baseGlyphName);
        const accentGlyphId = charset.indexOf(accentGlyphName);
        if (baseGlyphId < 0 || accentGlyphId < 0) {
          continue;
        }
        const accentOffset = {
          x: seac[0] * matrix[0] + seac[1] * matrix[2] + matrix[4],
          y: seac[0] * matrix[1] + seac[1] * matrix[3] + matrix[5]
        };
        const charCodes = getCharCodes(mapping, glyphId);
        if (!charCodes) {
          continue;
        }
        for (const charCode of charCodes) {
          const charCodeToGlyphId = newMapping.charCodeToGlyphId;
          const baseFontCharCode = createCharCode(charCodeToGlyphId, baseGlyphId);
          const accentFontCharCode = createCharCode(charCodeToGlyphId, accentGlyphId);
          seacMap[charCode] = {
            baseFontCharCode,
            accentFontCharCode,
            accentOffset
          };
        }
      }
      properties.seacMap = seacMap;
    }
    const unitsPerEm = properties.fontMatrix ? 1 / Math.max(...properties.fontMatrix.slice(0, 4).map(Math.abs)) : 1000;
    const builder = new OpenTypeFileBuilder("\x4F\x54\x54\x4F");
    builder.addTable("CFF ", font.data);
    builder.addTable("OS/2", createOS2Table(properties, newCharCodeToGlyphId));
    builder.addTable("cmap", createCmapTable(newCharCodeToGlyphId, toUnicodeExtraMap, numGlyphs));
    builder.addTable("head", "\x00\x01\x00\x00" + "\x00\x00\x10\x00" + "\x00\x00\x00\x00" + "\x5F\x0F\x3C\xF5" + "\x00\x00" + safeString16(unitsPerEm) + "\x00\x00\x00\x00\x9e\x0b\x7e\x27" + "\x00\x00\x00\x00\x9e\x0b\x7e\x27" + "\x00\x00" + safeString16(properties.descent) + "\x0F\xFF" + safeString16(properties.ascent) + string16(properties.italicAngle ? 2 : 0) + "\x00\x11" + "\x00\x00" + "\x00\x00" + "\x00\x00");
    builder.addTable("hhea", "\x00\x01\x00\x00" + safeString16(properties.ascent) + safeString16(properties.descent) + "\x00\x00" + "\xFF\xFF" + "\x00\x00" + "\x00\x00" + "\x00\x00" + safeString16(properties.capHeight) + safeString16(Math.tan(properties.italicAngle) * properties.xHeight) + "\x00\x00" + "\x00\x00" + "\x00\x00" + "\x00\x00" + "\x00\x00" + "\x00\x00" + string16(numGlyphs));
    builder.addTable("hmtx", function fontFieldsHmtx() {
      const charstrings = font.charstrings;
      const cffWidths = font.cff ? font.cff.widths : null;
      let hmtx = "\x00\x00\x00\x00";
      for (let i = 1, ii = numGlyphs; i < ii; i++) {
        let width = 0;
        if (charstrings) {
          const charstring = charstrings[i - 1];
          width = "width" in charstring ? charstring.width : 0;
        } else if (cffWidths) {
          width = Math.ceil(cffWidths[i] || 0);
        }
        hmtx += string16(width) + string16(0);
      }
      return hmtx;
    }());
    builder.addTable("maxp", "\x00\x00\x50\x00" + string16(numGlyphs));
    builder.addTable("name", createNameTable(fontName));
    builder.addTable("post", createPostTable(properties));
    return builder.toArray();
  }
  get _spaceWidth() {
    const possibleSpaceReplacements = ["space", "minus", "one", "i", "I"];
    let width;
    for (const glyphName of possibleSpaceReplacements) {
      if (glyphName in this.widths) {
        width = this.widths[glyphName];
        break;
      }
      const glyphsUnicodeMap = getGlyphsUnicode();
      const glyphUnicode = glyphsUnicodeMap[glyphName];
      let charcode = 0;
      if (this.composite && this.cMap.contains(glyphUnicode)) {
        charcode = this.cMap.lookup(glyphUnicode);
        if (typeof charcode === "string") {
          charcode = convertCidString(glyphUnicode, charcode);
        }
      }
      if (!charcode && this.toUnicode) {
        charcode = this.toUnicode.charCodeOf(glyphUnicode);
      }
      if (charcode <= 0) {
        charcode = glyphUnicode;
      }
      width = this.widths[charcode];
      if (width) {
        break;
      }
    }
    return shadow(this, "_spaceWidth", width || this.defaultWidth);
  }
  _charToGlyph(charcode, isSpace = false) {
    let glyph = this._glyphCache[charcode];
    if (glyph?.isSpace === isSpace) {
      return glyph;
    }
    let fontCharCode, width, operatorListId;
    let widthCode = charcode;
    if (this.cMap?.contains(charcode)) {
      widthCode = this.cMap.lookup(charcode);
      if (typeof widthCode === "string") {
        widthCode = convertCidString(charcode, widthCode);
      }
    }
    width = this.widths[widthCode];
    if (typeof width !== "number") {
      width = this.defaultWidth;
    }
    const vmetric = this.vmetrics?.[widthCode];
    let unicode = this.toUnicode.get(charcode) || charcode;
    if (typeof unicode === "number") {
      unicode = String.fromCharCode(unicode);
    }
    let isInFont = this.toFontChar[charcode] !== undefined;
    fontCharCode = this.toFontChar[charcode] || charcode;
    if (this.missingFile) {
      const glyphName = this.differences[charcode] || this.defaultEncoding[charcode];
      if ((glyphName === ".notdef" || glyphName === "") && this.type === "Type1") {
        fontCharCode = 0x20;
        if (glyphName === "") {
          width ||= this._spaceWidth;
          unicode = String.fromCharCode(fontCharCode);
        }
      }
      fontCharCode = mapSpecialUnicodeValues(fontCharCode);
    }
    if (this.isType3Font) {
      operatorListId = fontCharCode;
    }
    let accent = null;
    if (this.seacMap?.[charcode]) {
      isInFont = true;
      const seac = this.seacMap[charcode];
      fontCharCode = seac.baseFontCharCode;
      accent = {
        fontChar: String.fromCodePoint(seac.accentFontCharCode),
        offset: seac.accentOffset
      };
    }
    let fontChar = "";
    if (typeof fontCharCode === "number") {
      if (fontCharCode <= 0x10ffff) {
        fontChar = String.fromCodePoint(fontCharCode);
      } else {
        warn(`charToGlyph - invalid fontCharCode: ${fontCharCode}`);
      }
    }
    if (this.missingFile && this.vertical && fontChar.length === 1) {
      const vertical = getVerticalPresentationForm()[fontChar.charCodeAt(0)];
      if (vertical) {
        fontChar = unicode = String.fromCharCode(vertical);
      }
    }
    glyph = new fonts_Glyph(charcode, fontChar, unicode, accent, width, vmetric, operatorListId, isSpace, isInFont);
    return this._glyphCache[charcode] = glyph;
  }
  charsToGlyphs(chars) {
    let glyphs = this._charsCache[chars];
    if (glyphs) {
      return glyphs;
    }
    glyphs = [];
    if (this.cMap) {
      const c = Object.create(null),
        ii = chars.length;
      let i = 0;
      while (i < ii) {
        this.cMap.readCharCode(chars, i, c);
        const {
          charcode,
          length
        } = c;
        i += length;
        const glyph = this._charToGlyph(charcode, length === 1 && chars.charCodeAt(i - 1) === 0x20);
        glyphs.push(glyph);
      }
    } else {
      for (let i = 0, ii = chars.length; i < ii; ++i) {
        const charcode = chars.charCodeAt(i);
        const glyph = this._charToGlyph(charcode, charcode === 0x20);
        glyphs.push(glyph);
      }
    }
    return this._charsCache[chars] = glyphs;
  }
  getCharPositions(chars) {
    const positions = [];
    if (this.cMap) {
      const c = Object.create(null);
      let i = 0;
      while (i < chars.length) {
        this.cMap.readCharCode(chars, i, c);
        const length = c.length;
        positions.push([i, i + length]);
        i += length;
      }
    } else {
      for (let i = 0, ii = chars.length; i < ii; ++i) {
        positions.push([i, i + 1]);
      }
    }
    return positions;
  }
  get glyphCacheValues() {
    return Object.values(this._glyphCache);
  }
  encodeString(str) {
    const buffers = [];
    const currentBuf = [];
    const hasCurrentBufErrors = () => buffers.length % 2 === 1;
    const getCharCode = this.toUnicode instanceof IdentityToUnicodeMap ? unicode => this.toUnicode.charCodeOf(unicode) : unicode => this.toUnicode.charCodeOf(String.fromCodePoint(unicode));
    for (let i = 0, ii = str.length; i < ii; i++) {
      const unicode = str.codePointAt(i);
      if (unicode > 0xd7ff && (unicode < 0xe000 || unicode > 0xfffd)) {
        i++;
      }
      if (this.toUnicode) {
        const charCode = getCharCode(unicode);
        if (charCode !== -1) {
          if (hasCurrentBufErrors()) {
            buffers.push(currentBuf.join(""));
            currentBuf.length = 0;
          }
          const charCodeLength = this.cMap ? this.cMap.getCharCodeLength(charCode) : 1;
          for (let j = charCodeLength - 1; j >= 0; j--) {
            currentBuf.push(String.fromCharCode(charCode >> 8 * j & 0xff));
          }
          continue;
        }
      }
      if (!hasCurrentBufErrors()) {
        buffers.push(currentBuf.join(""));
        currentBuf.length = 0;
      }
      currentBuf.push(String.fromCodePoint(unicode));
    }
    buffers.push(currentBuf.join(""));
    return buffers;
  }
}
class ErrorFont {
  constructor(error) {
    this.error = error;
    this.loadedName = "g_font_error";
    this.missingFile = true;
  }
  charsToGlyphs() {
    return [];
  }
  encodeString(chars) {
    return [chars];
  }
  exportData() {
    return {
      error: this.error
    };
  }
}

;// ./src/core/pattern.js












const ShadingType = {
  FUNCTION_BASED: 1,
  AXIAL: 2,
  RADIAL: 3,
  FREE_FORM_MESH: 4,
  LATTICE_FORM_MESH: 5,
  COONS_PATCH_MESH: 6,
  TENSOR_PATCH_MESH: 7
};
class Pattern {
  constructor() {
    unreachable("Cannot initialize Pattern.");
  }
  static parseShading(shading, xref, res, pdfFunctionFactory, globalColorSpaceCache, localColorSpaceCache) {
    const dict = shading instanceof BaseStream ? shading.dict : shading;
    const type = dict.get("ShadingType");
    try {
      switch (type) {
        case ShadingType.AXIAL:
        case ShadingType.RADIAL:
          return new RadialAxialShading(dict, xref, res, pdfFunctionFactory, globalColorSpaceCache, localColorSpaceCache);
        case ShadingType.FREE_FORM_MESH:
        case ShadingType.LATTICE_FORM_MESH:
        case ShadingType.COONS_PATCH_MESH:
        case ShadingType.TENSOR_PATCH_MESH:
          return new MeshShading(shading, xref, res, pdfFunctionFactory, globalColorSpaceCache, localColorSpaceCache);
        default:
          throw new FormatError("Unsupported ShadingType: " + type);
      }
    } catch (ex) {
      if (ex instanceof MissingDataException) {
        throw ex;
      }
      warn(ex);
      return new DummyShading();
    }
  }
}
class BaseShading {
  static SMALL_NUMBER = 1e-6;
  getIR() {
    unreachable("Abstract method `getIR` called.");
  }
}
class RadialAxialShading extends BaseShading {
  constructor(dict, xref, resources, pdfFunctionFactory, globalColorSpaceCache, localColorSpaceCache) {
    super();
    this.shadingType = dict.get("ShadingType");
    let coordsLen = 0;
    if (this.shadingType === ShadingType.AXIAL) {
      coordsLen = 4;
    } else if (this.shadingType === ShadingType.RADIAL) {
      coordsLen = 6;
    }
    this.coordsArr = dict.getArray("Coords");
    if (!isNumberArray(this.coordsArr, coordsLen)) {
      throw new FormatError("RadialAxialShading: Invalid /Coords array.");
    }
    const cs = ColorSpaceUtils.parse({
      cs: dict.getRaw("CS") || dict.getRaw("ColorSpace"),
      xref,
      resources,
      pdfFunctionFactory,
      globalColorSpaceCache,
      localColorSpaceCache
    });
    this.bbox = lookupNormalRect(dict.getArray("BBox"), null);
    let t0 = 0.0,
      t1 = 1.0;
    const domainArr = dict.getArray("Domain");
    if (isNumberArray(domainArr, 2)) {
      [t0, t1] = domainArr;
    }
    let extendStart = false,
      extendEnd = false;
    const extendArr = dict.getArray("Extend");
    if (isBooleanArray(extendArr, 2)) {
      [extendStart, extendEnd] = extendArr;
    }
    if (this.shadingType === ShadingType.RADIAL && (!extendStart || !extendEnd)) {
      const [x1, y1, r1, x2, y2, r2] = this.coordsArr;
      const distance = Math.hypot(x1 - x2, y1 - y2);
      if (r1 <= r2 + distance && r2 <= r1 + distance) {
        warn("Unsupported radial gradient.");
      }
    }
    this.extendStart = extendStart;
    this.extendEnd = extendEnd;
    const fnObj = dict.getRaw("Function");
    const fn = pdfFunctionFactory.create(fnObj, true);
    const NUMBER_OF_SAMPLES = 840;
    const step = (t1 - t0) / NUMBER_OF_SAMPLES;
    const colorStops = this.colorStops = [];
    if (t0 >= t1 || step <= 0) {
      info("Bad shading domain.");
      return;
    }
    const color = new Float32Array(cs.numComps),
      ratio = new Float32Array(1);
    let iBase = 0;
    ratio[0] = t0;
    fn(ratio, 0, color, 0);
    const rgbBuffer = new Uint8ClampedArray(3);
    cs.getRgb(color, 0, rgbBuffer);
    let [rBase, gBase, bBase] = rgbBuffer;
    colorStops.push([0, Util.makeHexColor(rBase, gBase, bBase)]);
    let iPrev = 1;
    ratio[0] = t0 + step;
    fn(ratio, 0, color, 0);
    cs.getRgb(color, 0, rgbBuffer);
    let [rPrev, gPrev, bPrev] = rgbBuffer;
    let maxSlopeR = rPrev - rBase + 1;
    let maxSlopeG = gPrev - gBase + 1;
    let maxSlopeB = bPrev - bBase + 1;
    let minSlopeR = rPrev - rBase - 1;
    let minSlopeG = gPrev - gBase - 1;
    let minSlopeB = bPrev - bBase - 1;
    for (let i = 2; i < NUMBER_OF_SAMPLES; i++) {
      ratio[0] = t0 + i * step;
      fn(ratio, 0, color, 0);
      cs.getRgb(color, 0, rgbBuffer);
      const [r, g, b] = rgbBuffer;
      const run = i - iBase;
      maxSlopeR = Math.min(maxSlopeR, (r - rBase + 1) / run);
      maxSlopeG = Math.min(maxSlopeG, (g - gBase + 1) / run);
      maxSlopeB = Math.min(maxSlopeB, (b - bBase + 1) / run);
      minSlopeR = Math.max(minSlopeR, (r - rBase - 1) / run);
      minSlopeG = Math.max(minSlopeG, (g - gBase - 1) / run);
      minSlopeB = Math.max(minSlopeB, (b - bBase - 1) / run);
      const slopesExist = minSlopeR <= maxSlopeR && minSlopeG <= maxSlopeG && minSlopeB <= maxSlopeB;
      if (!slopesExist) {
        const cssColor = Util.makeHexColor(rPrev, gPrev, bPrev);
        colorStops.push([iPrev / NUMBER_OF_SAMPLES, cssColor]);
        maxSlopeR = r - rPrev + 1;
        maxSlopeG = g - gPrev + 1;
        maxSlopeB = b - bPrev + 1;
        minSlopeR = r - rPrev - 1;
        minSlopeG = g - gPrev - 1;
        minSlopeB = b - bPrev - 1;
        iBase = iPrev;
        rBase = rPrev;
        gBase = gPrev;
        bBase = bPrev;
      }
      iPrev = i;
      rPrev = r;
      gPrev = g;
      bPrev = b;
    }
    colorStops.push([1, Util.makeHexColor(rPrev, gPrev, bPrev)]);
    let background = "transparent";
    if (dict.has("Background")) {
      background = cs.getRgbHex(dict.get("Background"), 0);
    }
    if (!extendStart) {
      colorStops.unshift([0, background]);
      colorStops[1][0] += BaseShading.SMALL_NUMBER;
    }
    if (!extendEnd) {
      colorStops.at(-1)[0] -= BaseShading.SMALL_NUMBER;
      colorStops.push([1, background]);
    }
    this.colorStops = colorStops;
  }
  getIR() {
    const {
      coordsArr,
      shadingType
    } = this;
    let type, p0, p1, r0, r1;
    if (shadingType === ShadingType.AXIAL) {
      p0 = [coordsArr[0], coordsArr[1]];
      p1 = [coordsArr[2], coordsArr[3]];
      r0 = null;
      r1 = null;
      type = "axial";
    } else if (shadingType === ShadingType.RADIAL) {
      p0 = [coordsArr[0], coordsArr[1]];
      p1 = [coordsArr[3], coordsArr[4]];
      r0 = coordsArr[2];
      r1 = coordsArr[5];
      type = "radial";
    } else {
      unreachable(`getPattern type unknown: ${shadingType}`);
    }
    return ["RadialAxial", type, this.bbox, this.colorStops, p0, p1, r0, r1];
  }
}
class MeshStreamReader {
  constructor(stream, context) {
    this.stream = stream;
    this.context = context;
    this.buffer = 0;
    this.bufferLength = 0;
    const numComps = context.numComps;
    this.tmpCompsBuf = new Float32Array(numComps);
    const csNumComps = context.colorSpace.numComps;
    this.tmpCsCompsBuf = context.colorFn ? new Float32Array(csNumComps) : this.tmpCompsBuf;
  }
  get hasData() {
    if (this.stream.end) {
      return this.stream.pos < this.stream.end;
    }
    if (this.bufferLength > 0) {
      return true;
    }
    const nextByte = this.stream.getByte();
    if (nextByte < 0) {
      return false;
    }
    this.buffer = nextByte;
    this.bufferLength = 8;
    return true;
  }
  readBits(n) {
    const {
      stream
    } = this;
    let {
      buffer,
      bufferLength
    } = this;
    if (n === 32) {
      if (bufferLength === 0) {
        return stream.getInt32() >>> 0;
      }
      buffer = buffer << 24 | stream.getByte() << 16 | stream.getByte() << 8 | stream.getByte();
      const nextByte = stream.getByte();
      this.buffer = nextByte & (1 << bufferLength) - 1;
      return (buffer << 8 - bufferLength | (nextByte & 0xff) >> bufferLength) >>> 0;
    }
    if (n === 8 && bufferLength === 0) {
      return stream.getByte();
    }
    while (bufferLength < n) {
      buffer = buffer << 8 | stream.getByte();
      bufferLength += 8;
    }
    bufferLength -= n;
    this.bufferLength = bufferLength;
    this.buffer = buffer & (1 << bufferLength) - 1;
    return buffer >> bufferLength;
  }
  align() {
    this.buffer = 0;
    this.bufferLength = 0;
  }
  readFlag() {
    return this.readBits(this.context.bitsPerFlag);
  }
  readCoordinate() {
    const {
      bitsPerCoordinate,
      decode
    } = this.context;
    const xi = this.readBits(bitsPerCoordinate);
    const yi = this.readBits(bitsPerCoordinate);
    const scale = bitsPerCoordinate < 32 ? 1 / ((1 << bitsPerCoordinate) - 1) : 2.3283064365386963e-10;
    return [xi * scale * (decode[1] - decode[0]) + decode[0], yi * scale * (decode[3] - decode[2]) + decode[2]];
  }
  readComponents() {
    const {
      bitsPerComponent,
      colorFn,
      colorSpace,
      decode,
      numComps
    } = this.context;
    const scale = bitsPerComponent < 32 ? 1 / ((1 << bitsPerComponent) - 1) : 2.3283064365386963e-10;
    const components = this.tmpCompsBuf;
    for (let i = 0, j = 4; i < numComps; i++, j += 2) {
      const ci = this.readBits(bitsPerComponent);
      components[i] = ci * scale * (decode[j + 1] - decode[j]) + decode[j];
    }
    const color = this.tmpCsCompsBuf;
    colorFn?.(components, 0, color, 0);
    return colorSpace.getRgb(color, 0);
  }
}
let bCache = Object.create(null);
function buildB(count) {
  const lut = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count,
      t_ = 1 - t;
    lut.push(new Float32Array([t_ ** 3, 3 * t * t_ ** 2, 3 * t ** 2 * t_, t ** 3]));
  }
  return lut;
}
function getB(count) {
  return bCache[count] ||= buildB(count);
}
function clearPatternCaches() {
  bCache = Object.create(null);
}
class MeshShading extends BaseShading {
  static MIN_SPLIT_PATCH_CHUNKS_AMOUNT = 3;
  static MAX_SPLIT_PATCH_CHUNKS_AMOUNT = 20;
  static TRIANGLE_DENSITY = 20;
  constructor(stream, xref, resources, pdfFunctionFactory, globalColorSpaceCache, localColorSpaceCache) {
    super();
    if (!(stream instanceof BaseStream)) {
      throw new FormatError("Mesh data is not a stream");
    }
    const dict = stream.dict;
    this.shadingType = dict.get("ShadingType");
    this.bbox = lookupNormalRect(dict.getArray("BBox"), null);
    const cs = ColorSpaceUtils.parse({
      cs: dict.getRaw("CS") || dict.getRaw("ColorSpace"),
      xref,
      resources,
      pdfFunctionFactory,
      globalColorSpaceCache,
      localColorSpaceCache
    });
    this.background = dict.has("Background") ? cs.getRgb(dict.get("Background"), 0) : null;
    const fnObj = dict.getRaw("Function");
    const fn = fnObj ? pdfFunctionFactory.create(fnObj, true) : null;
    this.coords = [];
    this.colors = [];
    this.figures = [];
    const decodeContext = {
      bitsPerCoordinate: dict.get("BitsPerCoordinate"),
      bitsPerComponent: dict.get("BitsPerComponent"),
      bitsPerFlag: dict.get("BitsPerFlag"),
      decode: dict.getArray("Decode"),
      colorFn: fn,
      colorSpace: cs,
      numComps: fn ? 1 : cs.numComps
    };
    const reader = new MeshStreamReader(stream, decodeContext);
    let patchMesh = false;
    switch (this.shadingType) {
      case ShadingType.FREE_FORM_MESH:
        this._decodeType4Shading(reader);
        break;
      case ShadingType.LATTICE_FORM_MESH:
        const verticesPerRow = dict.get("VerticesPerRow") | 0;
        if (verticesPerRow < 2) {
          throw new FormatError("Invalid VerticesPerRow");
        }
        this._decodeType5Shading(reader, verticesPerRow);
        break;
      case ShadingType.COONS_PATCH_MESH:
        this._decodeType6Shading(reader);
        patchMesh = true;
        break;
      case ShadingType.TENSOR_PATCH_MESH:
        this._decodeType7Shading(reader);
        patchMesh = true;
        break;
      default:
        unreachable("Unsupported mesh type.");
        break;
    }
    if (patchMesh) {
      this._updateBounds();
      for (let i = 0, ii = this.figures.length; i < ii; i++) {
        this._buildFigureFromPatch(i);
      }
    }
    this._updateBounds();
    this._packData();
  }
  _decodeType4Shading(reader) {
    const coords = this.coords;
    const colors = this.colors;
    const operators = [];
    const ps = [];
    let verticesLeft = 0;
    while (reader.hasData) {
      const f = reader.readFlag();
      const coord = reader.readCoordinate();
      const color = reader.readComponents();
      if (verticesLeft === 0) {
        if (!(0 <= f && f <= 2)) {
          throw new FormatError("Unknown type4 flag");
        }
        switch (f) {
          case 0:
            verticesLeft = 3;
            break;
          case 1:
            ps.push(ps.at(-2), ps.at(-1));
            verticesLeft = 1;
            break;
          case 2:
            ps.push(ps.at(-3), ps.at(-1));
            verticesLeft = 1;
            break;
        }
        operators.push(f);
      }
      ps.push(coords.length);
      coords.push(coord);
      colors.push(color);
      verticesLeft--;
      reader.align();
    }
    this.figures.push({
      type: "triangles",
      coords: new Int32Array(ps),
      colors: new Int32Array(ps)
    });
  }
  _decodeType5Shading(reader, verticesPerRow) {
    const coords = this.coords;
    const colors = this.colors;
    const ps = [];
    while (reader.hasData) {
      const coord = reader.readCoordinate();
      const color = reader.readComponents();
      ps.push(coords.length);
      coords.push(coord);
      colors.push(color);
    }
    this.figures.push({
      type: "lattice",
      coords: new Int32Array(ps),
      colors: new Int32Array(ps),
      verticesPerRow
    });
  }
  _decodeType6Shading(reader) {
    const coords = this.coords;
    const colors = this.colors;
    const ps = new Int32Array(16);
    const cs = new Int32Array(4);
    while (reader.hasData) {
      const f = reader.readFlag();
      if (!(0 <= f && f <= 3)) {
        throw new FormatError("Unknown type6 flag");
      }
      const pi = coords.length;
      for (let i = 0, ii = f !== 0 ? 8 : 12; i < ii; i++) {
        coords.push(reader.readCoordinate());
      }
      const ci = colors.length;
      for (let i = 0, ii = f !== 0 ? 2 : 4; i < ii; i++) {
        colors.push(reader.readComponents());
      }
      let tmp1, tmp2, tmp3, tmp4;
      switch (f) {
        case 0:
          ps[12] = pi + 3;
          ps[13] = pi + 4;
          ps[14] = pi + 5;
          ps[15] = pi + 6;
          ps[8] = pi + 2;
          ps[11] = pi + 7;
          ps[4] = pi + 1;
          ps[7] = pi + 8;
          ps[0] = pi;
          ps[1] = pi + 11;
          ps[2] = pi + 10;
          ps[3] = pi + 9;
          cs[2] = ci + 1;
          cs[3] = ci + 2;
          cs[0] = ci;
          cs[1] = ci + 3;
          break;
        case 1:
          tmp1 = ps[12];
          tmp2 = ps[13];
          tmp3 = ps[14];
          tmp4 = ps[15];
          ps[12] = tmp4;
          ps[13] = pi + 0;
          ps[14] = pi + 1;
          ps[15] = pi + 2;
          ps[8] = tmp3;
          ps[11] = pi + 3;
          ps[4] = tmp2;
          ps[7] = pi + 4;
          ps[0] = tmp1;
          ps[1] = pi + 7;
          ps[2] = pi + 6;
          ps[3] = pi + 5;
          tmp1 = cs[2];
          tmp2 = cs[3];
          cs[2] = tmp2;
          cs[3] = ci;
          cs[0] = tmp1;
          cs[1] = ci + 1;
          break;
        case 2:
          tmp1 = ps[15];
          tmp2 = ps[11];
          ps[12] = ps[3];
          ps[13] = pi + 0;
          ps[14] = pi + 1;
          ps[15] = pi + 2;
          ps[8] = ps[7];
          ps[11] = pi + 3;
          ps[4] = tmp2;
          ps[7] = pi + 4;
          ps[0] = tmp1;
          ps[1] = pi + 7;
          ps[2] = pi + 6;
          ps[3] = pi + 5;
          tmp1 = cs[3];
          cs[2] = cs[1];
          cs[3] = ci;
          cs[0] = tmp1;
          cs[1] = ci + 1;
          break;
        case 3:
          ps[12] = ps[0];
          ps[13] = pi + 0;
          ps[14] = pi + 1;
          ps[15] = pi + 2;
          ps[8] = ps[1];
          ps[11] = pi + 3;
          ps[4] = ps[2];
          ps[7] = pi + 4;
          ps[0] = ps[3];
          ps[1] = pi + 7;
          ps[2] = pi + 6;
          ps[3] = pi + 5;
          cs[2] = cs[0];
          cs[3] = ci;
          cs[0] = cs[1];
          cs[1] = ci + 1;
          break;
      }
      ps[5] = coords.length;
      coords.push([(-4 * coords[ps[0]][0] - coords[ps[15]][0] + 6 * (coords[ps[4]][0] + coords[ps[1]][0]) - 2 * (coords[ps[12]][0] + coords[ps[3]][0]) + 3 * (coords[ps[13]][0] + coords[ps[7]][0])) / 9, (-4 * coords[ps[0]][1] - coords[ps[15]][1] + 6 * (coords[ps[4]][1] + coords[ps[1]][1]) - 2 * (coords[ps[12]][1] + coords[ps[3]][1]) + 3 * (coords[ps[13]][1] + coords[ps[7]][1])) / 9]);
      ps[6] = coords.length;
      coords.push([(-4 * coords[ps[3]][0] - coords[ps[12]][0] + 6 * (coords[ps[2]][0] + coords[ps[7]][0]) - 2 * (coords[ps[0]][0] + coords[ps[15]][0]) + 3 * (coords[ps[4]][0] + coords[ps[14]][0])) / 9, (-4 * coords[ps[3]][1] - coords[ps[12]][1] + 6 * (coords[ps[2]][1] + coords[ps[7]][1]) - 2 * (coords[ps[0]][1] + coords[ps[15]][1]) + 3 * (coords[ps[4]][1] + coords[ps[14]][1])) / 9]);
      ps[9] = coords.length;
      coords.push([(-4 * coords[ps[12]][0] - coords[ps[3]][0] + 6 * (coords[ps[8]][0] + coords[ps[13]][0]) - 2 * (coords[ps[0]][0] + coords[ps[15]][0]) + 3 * (coords[ps[11]][0] + coords[ps[1]][0])) / 9, (-4 * coords[ps[12]][1] - coords[ps[3]][1] + 6 * (coords[ps[8]][1] + coords[ps[13]][1]) - 2 * (coords[ps[0]][1] + coords[ps[15]][1]) + 3 * (coords[ps[11]][1] + coords[ps[1]][1])) / 9]);
      ps[10] = coords.length;
      coords.push([(-4 * coords[ps[15]][0] - coords[ps[0]][0] + 6 * (coords[ps[11]][0] + coords[ps[14]][0]) - 2 * (coords[ps[12]][0] + coords[ps[3]][0]) + 3 * (coords[ps[2]][0] + coords[ps[8]][0])) / 9, (-4 * coords[ps[15]][1] - coords[ps[0]][1] + 6 * (coords[ps[11]][1] + coords[ps[14]][1]) - 2 * (coords[ps[12]][1] + coords[ps[3]][1]) + 3 * (coords[ps[2]][1] + coords[ps[8]][1])) / 9]);
      this.figures.push({
        type: "patch",
        coords: new Int32Array(ps),
        colors: new Int32Array(cs)
      });
    }
  }
  _decodeType7Shading(reader) {
    const coords = this.coords;
    const colors = this.colors;
    const ps = new Int32Array(16);
    const cs = new Int32Array(4);
    while (reader.hasData) {
      const f = reader.readFlag();
      if (!(0 <= f && f <= 3)) {
        throw new FormatError("Unknown type7 flag");
      }
      const pi = coords.length;
      for (let i = 0, ii = f !== 0 ? 12 : 16; i < ii; i++) {
        coords.push(reader.readCoordinate());
      }
      const ci = colors.length;
      for (let i = 0, ii = f !== 0 ? 2 : 4; i < ii; i++) {
        colors.push(reader.readComponents());
      }
      let tmp1, tmp2, tmp3, tmp4;
      switch (f) {
        case 0:
          ps[12] = pi + 3;
          ps[13] = pi + 4;
          ps[14] = pi + 5;
          ps[15] = pi + 6;
          ps[8] = pi + 2;
          ps[9] = pi + 13;
          ps[10] = pi + 14;
          ps[11] = pi + 7;
          ps[4] = pi + 1;
          ps[5] = pi + 12;
          ps[6] = pi + 15;
          ps[7] = pi + 8;
          ps[0] = pi;
          ps[1] = pi + 11;
          ps[2] = pi + 10;
          ps[3] = pi + 9;
          cs[2] = ci + 1;
          cs[3] = ci + 2;
          cs[0] = ci;
          cs[1] = ci + 3;
          break;
        case 1:
          tmp1 = ps[12];
          tmp2 = ps[13];
          tmp3 = ps[14];
          tmp4 = ps[15];
          ps[12] = tmp4;
          ps[13] = pi + 0;
          ps[14] = pi + 1;
          ps[15] = pi + 2;
          ps[8] = tmp3;
          ps[9] = pi + 9;
          ps[10] = pi + 10;
          ps[11] = pi + 3;
          ps[4] = tmp2;
          ps[5] = pi + 8;
          ps[6] = pi + 11;
          ps[7] = pi + 4;
          ps[0] = tmp1;
          ps[1] = pi + 7;
          ps[2] = pi + 6;
          ps[3] = pi + 5;
          tmp1 = cs[2];
          tmp2 = cs[3];
          cs[2] = tmp2;
          cs[3] = ci;
          cs[0] = tmp1;
          cs[1] = ci + 1;
          break;
        case 2:
          tmp1 = ps[15];
          tmp2 = ps[11];
          ps[12] = ps[3];
          ps[13] = pi + 0;
          ps[14] = pi + 1;
          ps[15] = pi + 2;
          ps[8] = ps[7];
          ps[9] = pi + 9;
          ps[10] = pi + 10;
          ps[11] = pi + 3;
          ps[4] = tmp2;
          ps[5] = pi + 8;
          ps[6] = pi + 11;
          ps[7] = pi + 4;
          ps[0] = tmp1;
          ps[1] = pi + 7;
          ps[2] = pi + 6;
          ps[3] = pi + 5;
          tmp1 = cs[3];
          cs[2] = cs[1];
          cs[3] = ci;
          cs[0] = tmp1;
          cs[1] = ci + 1;
          break;
        case 3:
          ps[12] = ps[0];
          ps[13] = pi + 0;
          ps[14] = pi + 1;
          ps[15] = pi + 2;
          ps[8] = ps[1];
          ps[9] = pi + 9;
          ps[10] = pi + 10;
          ps[11] = pi + 3;
          ps[4] = ps[2];
          ps[5] = pi + 8;
          ps[6] = pi + 11;
          ps[7] = pi + 4;
          ps[0] = ps[3];
          ps[1] = pi + 7;
          ps[2] = pi + 6;
          ps[3] = pi + 5;
          cs[2] = cs[0];
          cs[3] = ci;
          cs[0] = cs[1];
          cs[1] = ci + 1;
          break;
      }
      this.figures.push({
        type: "patch",
        coords: new Int32Array(ps),
        colors: new Int32Array(cs)
      });
    }
  }
  _buildFigureFromPatch(index) {
    const figure = this.figures[index];
    assert(figure.type === "patch", "Unexpected patch mesh figure");
    const coords = this.coords,
      colors = this.colors;
    const pi = figure.coords;
    const ci = figure.colors;
    const figureMinX = Math.min(coords[pi[0]][0], coords[pi[3]][0], coords[pi[12]][0], coords[pi[15]][0]);
    const figureMinY = Math.min(coords[pi[0]][1], coords[pi[3]][1], coords[pi[12]][1], coords[pi[15]][1]);
    const figureMaxX = Math.max(coords[pi[0]][0], coords[pi[3]][0], coords[pi[12]][0], coords[pi[15]][0]);
    const figureMaxY = Math.max(coords[pi[0]][1], coords[pi[3]][1], coords[pi[12]][1], coords[pi[15]][1]);
    let splitXBy = Math.ceil((figureMaxX - figureMinX) * MeshShading.TRIANGLE_DENSITY / (this.bounds[2] - this.bounds[0]));
    splitXBy = MathClamp(splitXBy, MeshShading.MIN_SPLIT_PATCH_CHUNKS_AMOUNT, MeshShading.MAX_SPLIT_PATCH_CHUNKS_AMOUNT);
    let splitYBy = Math.ceil((figureMaxY - figureMinY) * MeshShading.TRIANGLE_DENSITY / (this.bounds[3] - this.bounds[1]));
    splitYBy = MathClamp(splitYBy, MeshShading.MIN_SPLIT_PATCH_CHUNKS_AMOUNT, MeshShading.MAX_SPLIT_PATCH_CHUNKS_AMOUNT);
    const verticesPerRow = splitXBy + 1;
    const figureCoords = new Int32Array((splitYBy + 1) * verticesPerRow);
    const figureColors = new Int32Array((splitYBy + 1) * verticesPerRow);
    let k = 0;
    const cl = new Uint8Array(3),
      cr = new Uint8Array(3);
    const c0 = colors[ci[0]],
      c1 = colors[ci[1]],
      c2 = colors[ci[2]],
      c3 = colors[ci[3]];
    const bRow = getB(splitYBy),
      bCol = getB(splitXBy);
    for (let row = 0; row <= splitYBy; row++) {
      cl[0] = (c0[0] * (splitYBy - row) + c2[0] * row) / splitYBy | 0;
      cl[1] = (c0[1] * (splitYBy - row) + c2[1] * row) / splitYBy | 0;
      cl[2] = (c0[2] * (splitYBy - row) + c2[2] * row) / splitYBy | 0;
      cr[0] = (c1[0] * (splitYBy - row) + c3[0] * row) / splitYBy | 0;
      cr[1] = (c1[1] * (splitYBy - row) + c3[1] * row) / splitYBy | 0;
      cr[2] = (c1[2] * (splitYBy - row) + c3[2] * row) / splitYBy | 0;
      for (let col = 0; col <= splitXBy; col++, k++) {
        if ((row === 0 || row === splitYBy) && (col === 0 || col === splitXBy)) {
          continue;
        }
        let x = 0,
          y = 0;
        let q = 0;
        for (let i = 0; i <= 3; i++) {
          for (let j = 0; j <= 3; j++, q++) {
            const m = bRow[row][i] * bCol[col][j];
            x += coords[pi[q]][0] * m;
            y += coords[pi[q]][1] * m;
          }
        }
        figureCoords[k] = coords.length;
        coords.push([x, y]);
        figureColors[k] = colors.length;
        const newColor = new Uint8Array(3);
        newColor[0] = (cl[0] * (splitXBy - col) + cr[0] * col) / splitXBy | 0;
        newColor[1] = (cl[1] * (splitXBy - col) + cr[1] * col) / splitXBy | 0;
        newColor[2] = (cl[2] * (splitXBy - col) + cr[2] * col) / splitXBy | 0;
        colors.push(newColor);
      }
    }
    figureCoords[0] = pi[0];
    figureColors[0] = ci[0];
    figureCoords[splitXBy] = pi[3];
    figureColors[splitXBy] = ci[1];
    figureCoords[verticesPerRow * splitYBy] = pi[12];
    figureColors[verticesPerRow * splitYBy] = ci[2];
    figureCoords[verticesPerRow * splitYBy + splitXBy] = pi[15];
    figureColors[verticesPerRow * splitYBy + splitXBy] = ci[3];
    this.figures[index] = {
      type: "lattice",
      coords: figureCoords,
      colors: figureColors,
      verticesPerRow
    };
  }
  _updateBounds() {
    let minX = this.coords[0][0],
      minY = this.coords[0][1],
      maxX = minX,
      maxY = minY;
    for (let i = 1, ii = this.coords.length; i < ii; i++) {
      const x = this.coords[i][0],
        y = this.coords[i][1];
      minX = minX > x ? x : minX;
      minY = minY > y ? y : minY;
      maxX = maxX < x ? x : maxX;
      maxY = maxY < y ? y : maxY;
    }
    this.bounds = [minX, minY, maxX, maxY];
  }
  _packData() {
    let i, ii, j, jj;
    const coords = this.coords;
    const coordsPacked = new Float32Array(coords.length * 2);
    for (i = 0, j = 0, ii = coords.length; i < ii; i++) {
      const xy = coords[i];
      coordsPacked[j++] = xy[0];
      coordsPacked[j++] = xy[1];
    }
    this.coords = coordsPacked;
    const colors = this.colors;
    const colorsPacked = new Uint8Array(colors.length * 3);
    for (i = 0, j = 0, ii = colors.length; i < ii; i++) {
      const c = colors[i];
      colorsPacked[j++] = c[0];
      colorsPacked[j++] = c[1];
      colorsPacked[j++] = c[2];
    }
    this.colors = colorsPacked;
    const figures = this.figures;
    for (i = 0, ii = figures.length; i < ii; i++) {
      const figure = figures[i],
        ps = figure.coords,
        cs = figure.colors;
      for (j = 0, jj = ps.length; j < jj; j++) {
        ps[j] *= 2;
        cs[j] *= 3;
      }
    }
  }
  getIR() {
    const {
      bounds
    } = this;
    if (bounds[2] - bounds[0] === 0 || bounds[3] - bounds[1] === 0) {
      throw new FormatError(`Invalid MeshShading bounds: [${bounds}].`);
    }
    return ["Mesh", this.shadingType, this.coords, this.colors, this.figures, bounds, this.bbox, this.background];
  }
}
class DummyShading extends BaseShading {
  getIR() {
    return ["Dummy"];
  }
}
function getTilingPatternIR(operatorList, dict, color) {
  const matrix = lookupMatrix(dict.getArray("Matrix"), IDENTITY_MATRIX);
  const bbox = lookupNormalRect(dict.getArray("BBox"), null);
  if (!bbox || bbox[2] - bbox[0] === 0 || bbox[3] - bbox[1] === 0) {
    throw new FormatError(`Invalid getTilingPatternIR /BBox array.`);
  }
  const xstep = dict.get("XStep");
  if (typeof xstep !== "number") {
    throw new FormatError(`Invalid getTilingPatternIR /XStep value.`);
  }
  const ystep = dict.get("YStep");
  if (typeof ystep !== "number") {
    throw new FormatError(`Invalid getTilingPatternIR /YStep value.`);
  }
  const paintType = dict.get("PaintType");
  if (!Number.isInteger(paintType)) {
    throw new FormatError(`Invalid getTilingPatternIR /PaintType value.`);
  }
  const tilingType = dict.get("TilingType");
  if (!Number.isInteger(tilingType)) {
    throw new FormatError(`Invalid getTilingPatternIR /TilingType value.`);
  }
  return ["TilingPattern", color, operatorList, matrix, bbox, xstep, ystep, paintType, tilingType];
}

;// ./src/core/calibri_factors.js
const CalibriBoldFactors = [1.3877, 1, 1, 1, 0.97801, 0.92482, 0.89552, 0.91133, 0.81988, 0.97566, 0.98152, 0.93548, 0.93548, 1.2798, 0.85284, 0.92794, 1, 0.96134, 1.54657, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.82845, 0.82845, 0.85284, 0.85284, 0.85284, 0.75859, 0.92138, 0.83908, 0.7762, 0.73293, 0.87289, 0.73133, 0.7514, 0.81921, 0.87356, 0.95958, 0.59526, 0.75727, 0.69225, 1.04924, 0.9121, 0.86943, 0.79795, 0.88198, 0.77958, 0.70864, 0.81055, 0.90399, 0.88653, 0.96017, 0.82577, 0.77892, 0.78257, 0.97507, 1.54657, 0.97507, 0.85284, 0.89552, 0.90176, 0.88762, 0.8785, 0.75241, 0.8785, 0.90518, 0.95015, 0.77618, 0.8785, 0.88401, 0.91916, 0.86304, 0.88401, 0.91488, 0.8785, 0.8801, 0.8785, 0.8785, 0.91343, 0.7173, 1.04106, 0.8785, 0.85075, 0.95794, 0.82616, 0.85162, 0.79492, 0.88331, 1.69808, 0.88331, 0.85284, 0.97801, 0.89552, 0.91133, 0.89552, 0.91133, 1.7801, 0.89552, 1.24487, 1.13254, 1.12401, 0.96839, 0.85284, 0.68787, 0.70645, 0.85592, 0.90747, 1.01466, 1.0088, 0.90323, 1, 1.07463, 1, 0.91056, 0.75806, 1.19118, 0.96839, 0.78864, 0.82845, 0.84133, 0.75859, 0.83908, 0.83908, 0.83908, 0.83908, 0.83908, 0.83908, 0.77539, 0.73293, 0.73133, 0.73133, 0.73133, 0.73133, 0.95958, 0.95958, 0.95958, 0.95958, 0.88506, 0.9121, 0.86943, 0.86943, 0.86943, 0.86943, 0.86943, 0.85284, 0.87508, 0.90399, 0.90399, 0.90399, 0.90399, 0.77892, 0.79795, 0.90807, 0.88762, 0.88762, 0.88762, 0.88762, 0.88762, 0.88762, 0.8715, 0.75241, 0.90518, 0.90518, 0.90518, 0.90518, 0.88401, 0.88401, 0.88401, 0.88401, 0.8785, 0.8785, 0.8801, 0.8801, 0.8801, 0.8801, 0.8801, 0.90747, 0.89049, 0.8785, 0.8785, 0.8785, 0.8785, 0.85162, 0.8785, 0.85162, 0.83908, 0.88762, 0.83908, 0.88762, 0.83908, 0.88762, 0.73293, 0.75241, 0.73293, 0.75241, 0.73293, 0.75241, 0.73293, 0.75241, 0.87289, 0.83016, 0.88506, 0.93125, 0.73133, 0.90518, 0.73133, 0.90518, 0.73133, 0.90518, 0.73133, 0.90518, 0.73133, 0.90518, 0.81921, 0.77618, 0.81921, 0.77618, 0.81921, 0.77618, 1, 1, 0.87356, 0.8785, 0.91075, 0.89608, 0.95958, 0.88401, 0.95958, 0.88401, 0.95958, 0.88401, 0.95958, 0.88401, 0.95958, 0.88401, 0.76229, 0.90167, 0.59526, 0.91916, 1, 1, 0.86304, 0.69225, 0.88401, 1, 1, 0.70424, 0.79468, 0.91926, 0.88175, 0.70823, 0.94903, 0.9121, 0.8785, 1, 1, 0.9121, 0.8785, 0.87802, 0.88656, 0.8785, 0.86943, 0.8801, 0.86943, 0.8801, 0.86943, 0.8801, 0.87402, 0.89291, 0.77958, 0.91343, 1, 1, 0.77958, 0.91343, 0.70864, 0.7173, 0.70864, 0.7173, 0.70864, 0.7173, 0.70864, 0.7173, 1, 1, 0.81055, 0.75841, 0.81055, 1.06452, 0.90399, 0.8785, 0.90399, 0.8785, 0.90399, 0.8785, 0.90399, 0.8785, 0.90399, 0.8785, 0.90399, 0.8785, 0.96017, 0.95794, 0.77892, 0.85162, 0.77892, 0.78257, 0.79492, 0.78257, 0.79492, 0.78257, 0.79492, 0.9297, 0.56892, 0.83908, 0.88762, 0.77539, 0.8715, 0.87508, 0.89049, 1, 1, 0.81055, 1.04106, 1.20528, 1.20528, 1, 1.15543, 0.70674, 0.98387, 0.94721, 1.33431, 1.45894, 0.95161, 1.06303, 0.83908, 0.80352, 0.57184, 0.6965, 0.56289, 0.82001, 0.56029, 0.81235, 1.02988, 0.83908, 0.7762, 0.68156, 0.80367, 0.73133, 0.78257, 0.87356, 0.86943, 0.95958, 0.75727, 0.89019, 1.04924, 0.9121, 0.7648, 0.86943, 0.87356, 0.79795, 0.78275, 0.81055, 0.77892, 0.9762, 0.82577, 0.99819, 0.84896, 0.95958, 0.77892, 0.96108, 1.01407, 0.89049, 1.02988, 0.94211, 0.96108, 0.8936, 0.84021, 0.87842, 0.96399, 0.79109, 0.89049, 1.00813, 1.02988, 0.86077, 0.87445, 0.92099, 0.84723, 0.86513, 0.8801, 0.75638, 0.85714, 0.78216, 0.79586, 0.87965, 0.94211, 0.97747, 0.78287, 0.97926, 0.84971, 1.02988, 0.94211, 0.8801, 0.94211, 0.84971, 0.73133, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.90264, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.90518, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.90548, 1, 1, 1, 1, 1, 1, 0.96017, 0.95794, 0.96017, 0.95794, 0.96017, 0.95794, 0.77892, 0.85162, 1, 1, 0.89552, 0.90527, 1, 0.90363, 0.92794, 0.92794, 0.92794, 0.92794, 0.87012, 0.87012, 0.87012, 0.89552, 0.89552, 1.42259, 0.71143, 1.06152, 1, 1, 1.03372, 1.03372, 0.97171, 1.4956, 2.2807, 0.93835, 0.83406, 0.91133, 0.84107, 0.91133, 1, 1, 1, 0.72021, 1, 1.23108, 0.83489, 0.88525, 0.88525, 0.81499, 0.90527, 1.81055, 0.90527, 1.81055, 1.31006, 1.53711, 0.94434, 1.08696, 1, 0.95018, 0.77192, 0.85284, 0.90747, 1.17534, 0.69825, 0.9716, 1.37077, 0.90747, 0.90747, 0.85356, 0.90747, 0.90747, 1.44947, 0.85284, 0.8941, 0.8941, 0.70572, 0.8, 0.70572, 0.70572, 0.70572, 0.70572, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.99862, 0.99862, 1, 1, 1, 1, 1, 1.08004, 0.91027, 1, 1, 1, 0.99862, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.90727, 0.90727, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const CalibriBoldMetrics = {
  lineHeight: 1.2207,
  lineGap: 0.2207
};
const CalibriBoldItalicFactors = [1.3877, 1, 1, 1, 0.97801, 0.92482, 0.89552, 0.91133, 0.81988, 0.97566, 0.98152, 0.93548, 0.93548, 1.2798, 0.85284, 0.92794, 1, 0.96134, 1.56239, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.82845, 0.82845, 0.85284, 0.85284, 0.85284, 0.75859, 0.92138, 0.83908, 0.7762, 0.71805, 0.87289, 0.73133, 0.7514, 0.81921, 0.87356, 0.95958, 0.59526, 0.75727, 0.69225, 1.04924, 0.90872, 0.85938, 0.79795, 0.87068, 0.77958, 0.69766, 0.81055, 0.90399, 0.88653, 0.96068, 0.82577, 0.77892, 0.78257, 0.97507, 1.529, 0.97507, 0.85284, 0.89552, 0.90176, 0.94908, 0.86411, 0.74012, 0.86411, 0.88323, 0.95015, 0.86411, 0.86331, 0.88401, 0.91916, 0.86304, 0.88401, 0.9039, 0.86331, 0.86331, 0.86411, 0.86411, 0.90464, 0.70852, 1.04106, 0.86331, 0.84372, 0.95794, 0.82616, 0.84548, 0.79492, 0.88331, 1.69808, 0.88331, 0.85284, 0.97801, 0.89552, 0.91133, 0.89552, 0.91133, 1.7801, 0.89552, 1.24487, 1.13254, 1.19129, 0.96839, 0.85284, 0.68787, 0.70645, 0.85592, 0.90747, 1.01466, 1.0088, 0.90323, 1, 1.07463, 1, 0.91056, 0.75806, 1.19118, 0.96839, 0.78864, 0.82845, 0.84133, 0.75859, 0.83908, 0.83908, 0.83908, 0.83908, 0.83908, 0.83908, 0.77539, 0.71805, 0.73133, 0.73133, 0.73133, 0.73133, 0.95958, 0.95958, 0.95958, 0.95958, 0.88506, 0.90872, 0.85938, 0.85938, 0.85938, 0.85938, 0.85938, 0.85284, 0.87068, 0.90399, 0.90399, 0.90399, 0.90399, 0.77892, 0.79795, 0.90807, 0.94908, 0.94908, 0.94908, 0.94908, 0.94908, 0.94908, 0.85887, 0.74012, 0.88323, 0.88323, 0.88323, 0.88323, 0.88401, 0.88401, 0.88401, 0.88401, 0.8785, 0.86331, 0.86331, 0.86331, 0.86331, 0.86331, 0.86331, 0.90747, 0.89049, 0.86331, 0.86331, 0.86331, 0.86331, 0.84548, 0.86411, 0.84548, 0.83908, 0.94908, 0.83908, 0.94908, 0.83908, 0.94908, 0.71805, 0.74012, 0.71805, 0.74012, 0.71805, 0.74012, 0.71805, 0.74012, 0.87289, 0.79538, 0.88506, 0.92726, 0.73133, 0.88323, 0.73133, 0.88323, 0.73133, 0.88323, 0.73133, 0.88323, 0.73133, 0.88323, 0.81921, 0.86411, 0.81921, 0.86411, 0.81921, 0.86411, 1, 1, 0.87356, 0.86331, 0.91075, 0.8777, 0.95958, 0.88401, 0.95958, 0.88401, 0.95958, 0.88401, 0.95958, 0.88401, 0.95958, 0.88401, 0.76467, 0.90167, 0.59526, 0.91916, 1, 1, 0.86304, 0.69225, 0.88401, 1, 1, 0.70424, 0.77312, 0.91926, 0.88175, 0.70823, 0.94903, 0.90872, 0.86331, 1, 1, 0.90872, 0.86331, 0.86906, 0.88116, 0.86331, 0.85938, 0.86331, 0.85938, 0.86331, 0.85938, 0.86331, 0.87402, 0.86549, 0.77958, 0.90464, 1, 1, 0.77958, 0.90464, 0.69766, 0.70852, 0.69766, 0.70852, 0.69766, 0.70852, 0.69766, 0.70852, 1, 1, 0.81055, 0.75841, 0.81055, 1.06452, 0.90399, 0.86331, 0.90399, 0.86331, 0.90399, 0.86331, 0.90399, 0.86331, 0.90399, 0.86331, 0.90399, 0.86331, 0.96068, 0.95794, 0.77892, 0.84548, 0.77892, 0.78257, 0.79492, 0.78257, 0.79492, 0.78257, 0.79492, 0.9297, 0.56892, 0.83908, 0.94908, 0.77539, 0.85887, 0.87068, 0.89049, 1, 1, 0.81055, 1.04106, 1.20528, 1.20528, 1, 1.15543, 0.70088, 0.98387, 0.94721, 1.33431, 1.45894, 0.95161, 1.48387, 0.83908, 0.80352, 0.57118, 0.6965, 0.56347, 0.79179, 0.55853, 0.80346, 1.02988, 0.83908, 0.7762, 0.67174, 0.86036, 0.73133, 0.78257, 0.87356, 0.86441, 0.95958, 0.75727, 0.89019, 1.04924, 0.90872, 0.74889, 0.85938, 0.87891, 0.79795, 0.7957, 0.81055, 0.77892, 0.97447, 0.82577, 0.97466, 0.87179, 0.95958, 0.77892, 0.94252, 0.95612, 0.8753, 1.02988, 0.92733, 0.94252, 0.87411, 0.84021, 0.8728, 0.95612, 0.74081, 0.8753, 1.02189, 1.02988, 0.84814, 0.87445, 0.91822, 0.84723, 0.85668, 0.86331, 0.81344, 0.87581, 0.76422, 0.82046, 0.96057, 0.92733, 0.99375, 0.78022, 0.95452, 0.86015, 1.02988, 0.92733, 0.86331, 0.92733, 0.86015, 0.73133, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.90631, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.88323, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.85174, 1, 1, 1, 1, 1, 1, 0.96068, 0.95794, 0.96068, 0.95794, 0.96068, 0.95794, 0.77892, 0.84548, 1, 1, 0.89552, 0.90527, 1, 0.90363, 0.92794, 0.92794, 0.92794, 0.89807, 0.87012, 0.87012, 0.87012, 0.89552, 0.89552, 1.42259, 0.71094, 1.06152, 1, 1, 1.03372, 1.03372, 0.97171, 1.4956, 2.2807, 0.92972, 0.83406, 0.91133, 0.83326, 0.91133, 1, 1, 1, 0.72021, 1, 1.23108, 0.83489, 0.88525, 0.88525, 0.81499, 0.90616, 1.81055, 0.90527, 1.81055, 1.3107, 1.53711, 0.94434, 1.08696, 1, 0.95018, 0.77192, 0.85284, 0.90747, 1.17534, 0.69825, 0.9716, 1.37077, 0.90747, 0.90747, 0.85356, 0.90747, 0.90747, 1.44947, 0.85284, 0.8941, 0.8941, 0.70572, 0.8, 0.70572, 0.70572, 0.70572, 0.70572, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.99862, 0.99862, 1, 1, 1, 1, 1, 1.08004, 0.91027, 1, 1, 1, 0.99862, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.90727, 0.90727, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const CalibriBoldItalicMetrics = {
  lineHeight: 1.2207,
  lineGap: 0.2207
};
const CalibriItalicFactors = [1.3877, 1, 1, 1, 1.17223, 1.1293, 0.89552, 0.91133, 0.80395, 1.02269, 1.15601, 0.91056, 0.91056, 1.2798, 0.85284, 0.89807, 1, 0.90861, 1.39543, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.96309, 0.96309, 0.85284, 0.85284, 0.85284, 0.83319, 0.88071, 0.8675, 0.81552, 0.72346, 0.85193, 0.73206, 0.7522, 0.81105, 0.86275, 0.90685, 0.6377, 0.77892, 0.75593, 1.02638, 0.89249, 0.84118, 0.77452, 0.85374, 0.75186, 0.67789, 0.79776, 0.88844, 0.85066, 0.94309, 0.77818, 0.7306, 0.76659, 1.10369, 1.38313, 1.10369, 1.06139, 0.89552, 0.8739, 0.9245, 0.9245, 0.83203, 0.9245, 0.85865, 1.09842, 0.9245, 0.9245, 1.03297, 1.07692, 0.90918, 1.03297, 0.94959, 0.9245, 0.92274, 0.9245, 0.9245, 1.02933, 0.77832, 1.20562, 0.9245, 0.8916, 0.98986, 0.86621, 0.89453, 0.79004, 0.94152, 1.77256, 0.94152, 0.85284, 0.97801, 0.89552, 0.91133, 0.89552, 0.91133, 1.91729, 0.89552, 1.17889, 1.13254, 1.16359, 0.92098, 0.85284, 0.68787, 0.71353, 0.84737, 0.90747, 1.0088, 1.0044, 0.87683, 1, 1.09091, 1, 0.92229, 0.739, 1.15642, 0.92098, 0.76288, 0.80504, 0.80972, 0.75859, 0.8675, 0.8675, 0.8675, 0.8675, 0.8675, 0.8675, 0.76318, 0.72346, 0.73206, 0.73206, 0.73206, 0.73206, 0.90685, 0.90685, 0.90685, 0.90685, 0.86477, 0.89249, 0.84118, 0.84118, 0.84118, 0.84118, 0.84118, 0.85284, 0.84557, 0.88844, 0.88844, 0.88844, 0.88844, 0.7306, 0.77452, 0.86331, 0.9245, 0.9245, 0.9245, 0.9245, 0.9245, 0.9245, 0.84843, 0.83203, 0.85865, 0.85865, 0.85865, 0.85865, 0.82601, 0.82601, 0.82601, 0.82601, 0.94469, 0.9245, 0.92274, 0.92274, 0.92274, 0.92274, 0.92274, 0.90747, 0.86651, 0.9245, 0.9245, 0.9245, 0.9245, 0.89453, 0.9245, 0.89453, 0.8675, 0.9245, 0.8675, 0.9245, 0.8675, 0.9245, 0.72346, 0.83203, 0.72346, 0.83203, 0.72346, 0.83203, 0.72346, 0.83203, 0.85193, 0.8875, 0.86477, 0.99034, 0.73206, 0.85865, 0.73206, 0.85865, 0.73206, 0.85865, 0.73206, 0.85865, 0.73206, 0.85865, 0.81105, 0.9245, 0.81105, 0.9245, 0.81105, 0.9245, 1, 1, 0.86275, 0.9245, 0.90872, 0.93591, 0.90685, 0.82601, 0.90685, 0.82601, 0.90685, 0.82601, 0.90685, 1.03297, 0.90685, 0.82601, 0.77896, 1.05611, 0.6377, 1.07692, 1, 1, 0.90918, 0.75593, 1.03297, 1, 1, 0.76032, 0.9375, 0.98156, 0.93407, 0.77261, 1.11429, 0.89249, 0.9245, 1, 1, 0.89249, 0.9245, 0.92534, 0.86698, 0.9245, 0.84118, 0.92274, 0.84118, 0.92274, 0.84118, 0.92274, 0.8667, 0.86291, 0.75186, 1.02933, 1, 1, 0.75186, 1.02933, 0.67789, 0.77832, 0.67789, 0.77832, 0.67789, 0.77832, 0.67789, 0.77832, 1, 1, 0.79776, 0.97655, 0.79776, 1.23023, 0.88844, 0.9245, 0.88844, 0.9245, 0.88844, 0.9245, 0.88844, 0.9245, 0.88844, 0.9245, 0.88844, 0.9245, 0.94309, 0.98986, 0.7306, 0.89453, 0.7306, 0.76659, 0.79004, 0.76659, 0.79004, 0.76659, 0.79004, 1.09231, 0.54873, 0.8675, 0.9245, 0.76318, 0.84843, 0.84557, 0.86651, 1, 1, 0.79776, 1.20562, 1.18622, 1.18622, 1, 1.1437, 0.67009, 0.96334, 0.93695, 1.35191, 1.40909, 0.95161, 1.48387, 0.8675, 0.90861, 0.6192, 0.7363, 0.64824, 0.82411, 0.56321, 0.85696, 1.23516, 0.8675, 0.81552, 0.7286, 0.84134, 0.73206, 0.76659, 0.86275, 0.84369, 0.90685, 0.77892, 0.85871, 1.02638, 0.89249, 0.75828, 0.84118, 0.85984, 0.77452, 0.76466, 0.79776, 0.7306, 0.90782, 0.77818, 0.903, 0.87291, 0.90685, 0.7306, 0.99058, 1.03667, 0.94635, 1.23516, 0.9849, 0.99058, 0.92393, 0.8916, 0.942, 1.03667, 0.75026, 0.94635, 1.0297, 1.23516, 0.90918, 0.94048, 0.98217, 0.89746, 0.84153, 0.92274, 0.82507, 0.88832, 0.84438, 0.88178, 1.03525, 0.9849, 1.00225, 0.78086, 0.97248, 0.89404, 1.23516, 0.9849, 0.92274, 0.9849, 0.89404, 0.73206, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.89693, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.85865, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.90933, 1, 1, 1, 1, 1, 1, 0.94309, 0.98986, 0.94309, 0.98986, 0.94309, 0.98986, 0.7306, 0.89453, 1, 1, 0.89552, 0.90527, 1, 0.90186, 1.12308, 1.12308, 1.12308, 1.12308, 1.2566, 1.2566, 1.2566, 0.89552, 0.89552, 1.42259, 0.68994, 1.03809, 1, 1, 1.0176, 1.0176, 1.11523, 1.4956, 2.01462, 0.97858, 0.82616, 0.91133, 0.83437, 0.91133, 1, 1, 1, 0.70508, 1, 1.23108, 0.79801, 0.84426, 0.84426, 0.774, 0.90572, 1.81055, 0.90749, 1.81055, 1.28809, 1.55469, 0.94434, 1.07806, 1, 0.97094, 0.7589, 0.85284, 0.90747, 1.19658, 0.69825, 0.97622, 1.33512, 0.90747, 0.90747, 0.85284, 0.90747, 0.90747, 1.44947, 0.85284, 0.8941, 0.8941, 0.70572, 0.8, 0.70572, 0.70572, 0.70572, 0.70572, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.99862, 0.99862, 1, 1, 1, 1, 1, 1.0336, 0.91027, 1, 1, 1, 0.99862, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.05859, 1.05859, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const CalibriItalicMetrics = {
  lineHeight: 1.2207,
  lineGap: 0.2207
};
const CalibriRegularFactors = [1.3877, 1, 1, 1, 1.17223, 1.1293, 0.89552, 0.91133, 0.80395, 1.02269, 1.15601, 0.91056, 0.91056, 1.2798, 0.85284, 0.89807, 1, 0.90861, 1.39016, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.91133, 0.96309, 0.96309, 0.85284, 0.85284, 0.85284, 0.83319, 0.88071, 0.8675, 0.81552, 0.73834, 0.85193, 0.73206, 0.7522, 0.81105, 0.86275, 0.90685, 0.6377, 0.77892, 0.75593, 1.02638, 0.89385, 0.85122, 0.77452, 0.86503, 0.75186, 0.68887, 0.79776, 0.88844, 0.85066, 0.94258, 0.77818, 0.7306, 0.76659, 1.10369, 1.39016, 1.10369, 1.06139, 0.89552, 0.8739, 0.86128, 0.94469, 0.8457, 0.94469, 0.89464, 1.09842, 0.84636, 0.94469, 1.03297, 1.07692, 0.90918, 1.03297, 0.95897, 0.94469, 0.9482, 0.94469, 0.94469, 1.04692, 0.78223, 1.20562, 0.94469, 0.90332, 0.98986, 0.86621, 0.90527, 0.79004, 0.94152, 1.77256, 0.94152, 0.85284, 0.97801, 0.89552, 0.91133, 0.89552, 0.91133, 1.91729, 0.89552, 1.17889, 1.13254, 1.08707, 0.92098, 0.85284, 0.68787, 0.71353, 0.84737, 0.90747, 1.0088, 1.0044, 0.87683, 1, 1.09091, 1, 0.92229, 0.739, 1.15642, 0.92098, 0.76288, 0.80504, 0.80972, 0.75859, 0.8675, 0.8675, 0.8675, 0.8675, 0.8675, 0.8675, 0.76318, 0.73834, 0.73206, 0.73206, 0.73206, 0.73206, 0.90685, 0.90685, 0.90685, 0.90685, 0.86477, 0.89385, 0.85122, 0.85122, 0.85122, 0.85122, 0.85122, 0.85284, 0.85311, 0.88844, 0.88844, 0.88844, 0.88844, 0.7306, 0.77452, 0.86331, 0.86128, 0.86128, 0.86128, 0.86128, 0.86128, 0.86128, 0.8693, 0.8457, 0.89464, 0.89464, 0.89464, 0.89464, 0.82601, 0.82601, 0.82601, 0.82601, 0.94469, 0.94469, 0.9482, 0.9482, 0.9482, 0.9482, 0.9482, 0.90747, 0.86651, 0.94469, 0.94469, 0.94469, 0.94469, 0.90527, 0.94469, 0.90527, 0.8675, 0.86128, 0.8675, 0.86128, 0.8675, 0.86128, 0.73834, 0.8457, 0.73834, 0.8457, 0.73834, 0.8457, 0.73834, 0.8457, 0.85193, 0.92454, 0.86477, 0.9921, 0.73206, 0.89464, 0.73206, 0.89464, 0.73206, 0.89464, 0.73206, 0.89464, 0.73206, 0.89464, 0.81105, 0.84636, 0.81105, 0.84636, 0.81105, 0.84636, 1, 1, 0.86275, 0.94469, 0.90872, 0.95786, 0.90685, 0.82601, 0.90685, 0.82601, 0.90685, 0.82601, 0.90685, 1.03297, 0.90685, 0.82601, 0.77741, 1.05611, 0.6377, 1.07692, 1, 1, 0.90918, 0.75593, 1.03297, 1, 1, 0.76032, 0.90452, 0.98156, 1.11842, 0.77261, 1.11429, 0.89385, 0.94469, 1, 1, 0.89385, 0.94469, 0.95877, 0.86901, 0.94469, 0.85122, 0.9482, 0.85122, 0.9482, 0.85122, 0.9482, 0.8667, 0.90016, 0.75186, 1.04692, 1, 1, 0.75186, 1.04692, 0.68887, 0.78223, 0.68887, 0.78223, 0.68887, 0.78223, 0.68887, 0.78223, 1, 1, 0.79776, 0.92188, 0.79776, 1.23023, 0.88844, 0.94469, 0.88844, 0.94469, 0.88844, 0.94469, 0.88844, 0.94469, 0.88844, 0.94469, 0.88844, 0.94469, 0.94258, 0.98986, 0.7306, 0.90527, 0.7306, 0.76659, 0.79004, 0.76659, 0.79004, 0.76659, 0.79004, 1.09231, 0.54873, 0.8675, 0.86128, 0.76318, 0.8693, 0.85311, 0.86651, 1, 1, 0.79776, 1.20562, 1.18622, 1.18622, 1, 1.1437, 0.67742, 0.96334, 0.93695, 1.35191, 1.40909, 0.95161, 1.48387, 0.86686, 0.90861, 0.62267, 0.74359, 0.65649, 0.85498, 0.56963, 0.88254, 1.23516, 0.8675, 0.81552, 0.75443, 0.84503, 0.73206, 0.76659, 0.86275, 0.85122, 0.90685, 0.77892, 0.85746, 1.02638, 0.89385, 0.75657, 0.85122, 0.86275, 0.77452, 0.74171, 0.79776, 0.7306, 0.95165, 0.77818, 0.89772, 0.88831, 0.90685, 0.7306, 0.98142, 1.02191, 0.96576, 1.23516, 0.99018, 0.98142, 0.9236, 0.89258, 0.94035, 1.02191, 0.78848, 0.96576, 0.9561, 1.23516, 0.90918, 0.92578, 0.95424, 0.89746, 0.83969, 0.9482, 0.80113, 0.89442, 0.85208, 0.86155, 0.98022, 0.99018, 1.00452, 0.81209, 0.99247, 0.89181, 1.23516, 0.99018, 0.9482, 0.99018, 0.89181, 0.73206, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.88844, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.89464, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.96766, 1, 1, 1, 1, 1, 1, 0.94258, 0.98986, 0.94258, 0.98986, 0.94258, 0.98986, 0.7306, 0.90527, 1, 1, 0.89552, 0.90527, 1, 0.90186, 1.12308, 1.12308, 1.12308, 1.12308, 1.2566, 1.2566, 1.2566, 0.89552, 0.89552, 1.42259, 0.69043, 1.03809, 1, 1, 1.0176, 1.0176, 1.11523, 1.4956, 2.01462, 0.99331, 0.82616, 0.91133, 0.84286, 0.91133, 1, 1, 1, 0.70508, 1, 1.23108, 0.79801, 0.84426, 0.84426, 0.774, 0.90527, 1.81055, 0.90527, 1.81055, 1.28809, 1.55469, 0.94434, 1.07806, 1, 0.97094, 0.7589, 0.85284, 0.90747, 1.19658, 0.69825, 0.97622, 1.33512, 0.90747, 0.90747, 0.85356, 0.90747, 0.90747, 1.44947, 0.85284, 0.8941, 0.8941, 0.70572, 0.8, 0.70572, 0.70572, 0.70572, 0.70572, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0.99862, 0.99862, 1, 1, 1, 1, 1, 1.0336, 0.91027, 1, 1, 1, 0.99862, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1.05859, 1.05859, 1, 1, 1, 1.07185, 0.99413, 0.96334, 1.08065, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const CalibriRegularMetrics = {
  lineHeight: 1.2207,
  lineGap: 0.2207
};

;// ./src/core/helvetica_factors.js
const HelveticaBoldFactors = [0.76116, 1, 1, 1.0006, 0.99998, 0.99974, 0.99973, 0.99973, 0.99982, 0.99977, 1.00087, 0.99998, 0.99998, 0.99959, 1.00003, 1.0006, 0.99998, 1.0006, 1.0006, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99998, 1, 1.00003, 1.00003, 1.00003, 1.00026, 0.9999, 0.99977, 0.99977, 0.99977, 0.99977, 1.00001, 1.00026, 1.00022, 0.99977, 1.0006, 0.99973, 0.99977, 1.00026, 0.99999, 0.99977, 1.00022, 1.00001, 1.00022, 0.99977, 1.00001, 1.00026, 0.99977, 1.00001, 1.00016, 1.00001, 1.00001, 1.00026, 0.99998, 1.0006, 0.99998, 1.00003, 0.99973, 0.99998, 0.99973, 1.00026, 0.99973, 1.00026, 0.99973, 0.99998, 1.00026, 1.00026, 1.0006, 1.0006, 0.99973, 1.0006, 0.99982, 1.00026, 1.00026, 1.00026, 1.00026, 0.99959, 0.99973, 0.99998, 1.00026, 0.99973, 1.00022, 0.99973, 0.99973, 1, 0.99959, 1.00077, 0.99959, 1.00003, 0.99998, 0.99973, 0.99973, 0.99973, 0.99973, 1.00077, 0.99973, 0.99998, 1.00025, 0.99968, 0.99973, 1.00003, 1.00025, 0.60299, 1.00024, 1.06409, 1, 1, 0.99998, 1, 0.99973, 1.0006, 0.99998, 1, 0.99936, 0.99973, 1.00002, 1.00002, 1.00002, 1.00026, 0.99977, 0.99977, 0.99977, 0.99977, 0.99977, 0.99977, 1, 0.99977, 1.00001, 1.00001, 1.00001, 1.00001, 1.0006, 1.0006, 1.0006, 1.0006, 0.99977, 0.99977, 1.00022, 1.00022, 1.00022, 1.00022, 1.00022, 1.00003, 1.00022, 0.99977, 0.99977, 0.99977, 0.99977, 1.00001, 1.00001, 1.00026, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99982, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 1.0006, 1.0006, 1.0006, 1.0006, 1.00026, 1.00026, 1.00026, 1.00026, 1.00026, 1.00026, 1.00026, 1.06409, 1.00026, 1.00026, 1.00026, 1.00026, 1.00026, 0.99973, 1.00026, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 1.03374, 0.99977, 1.00026, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00022, 1.00026, 1.00022, 1.00026, 1.00022, 1.00026, 1.00022, 1.00026, 0.99977, 1.00026, 0.99977, 1.00026, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 1.00042, 0.99973, 0.99973, 1.0006, 0.99977, 0.99973, 0.99973, 1.00026, 1.0006, 1.00026, 1.0006, 1.00026, 1.03828, 1.00026, 0.99999, 1.00026, 1.0006, 0.99977, 1.00026, 0.99977, 1.00026, 0.99977, 1.00026, 0.9993, 0.9998, 1.00026, 1.00022, 1.00026, 1.00022, 1.00026, 1.00022, 1.00026, 1, 1.00016, 0.99977, 0.99959, 0.99977, 0.99959, 0.99977, 0.99959, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00026, 0.99998, 1.00026, 0.8121, 1.00026, 0.99998, 0.99977, 1.00026, 0.99977, 1.00026, 0.99977, 1.00026, 0.99977, 1.00026, 0.99977, 1.00026, 0.99977, 1.00026, 1.00016, 1.00022, 1.00001, 0.99973, 1.00001, 1.00026, 1, 1.00026, 1, 1.00026, 1, 1.0006, 0.99973, 0.99977, 0.99973, 1, 0.99982, 1.00022, 1.00026, 1.00001, 0.99973, 1.00026, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 1.00034, 0.99977, 1, 0.99997, 1.00026, 1.00078, 1.00036, 0.99973, 1.00013, 1.0006, 0.99977, 0.99977, 0.99988, 0.85148, 1.00001, 1.00026, 0.99977, 1.00022, 1.0006, 0.99977, 1.00001, 0.99999, 0.99977, 1.00069, 1.00022, 0.99977, 1.00001, 0.99984, 1.00026, 1.00001, 1.00024, 1.00001, 0.9999, 1, 1.0006, 1.00001, 1.00041, 0.99962, 1.00026, 1.0006, 0.99995, 1.00041, 0.99942, 0.99973, 0.99927, 1.00082, 0.99902, 1.00026, 1.00087, 1.0006, 1.00069, 0.99973, 0.99867, 0.99973, 0.9993, 1.00026, 1.00049, 1.00056, 1, 0.99988, 0.99935, 0.99995, 0.99954, 1.00055, 0.99945, 1.00032, 1.0006, 0.99995, 1.00026, 0.99995, 1.00032, 1.00001, 1.00008, 0.99971, 1.00019, 0.9994, 1.00001, 1.0006, 1.00044, 0.99973, 1.00023, 1.00047, 1, 0.99942, 0.99561, 0.99989, 1.00035, 0.99977, 1.00035, 0.99977, 1.00019, 0.99944, 1.00001, 1.00021, 0.99926, 1.00035, 1.00035, 0.99942, 1.00048, 0.99999, 0.99977, 1.00022, 1.00035, 1.00001, 0.99977, 1.00026, 0.99989, 1.00057, 1.00001, 0.99936, 1.00052, 1.00012, 0.99996, 1.00043, 1, 1.00035, 0.9994, 0.99976, 1.00035, 0.99973, 1.00052, 1.00041, 1.00119, 1.00037, 0.99973, 1.00002, 0.99986, 1.00041, 1.00041, 0.99902, 0.9996, 1.00034, 0.99999, 1.00026, 0.99999, 1.00026, 0.99973, 1.00052, 0.99973, 1, 0.99973, 1.00041, 1.00075, 0.9994, 1.0003, 0.99999, 1, 1.00041, 0.99955, 1, 0.99915, 0.99973, 0.99973, 1.00026, 1.00119, 0.99955, 0.99973, 1.0006, 0.99911, 1.0006, 1.00026, 0.99972, 1.00026, 0.99902, 1.00041, 0.99973, 0.99999, 1, 1, 1.00038, 1.0005, 1.00016, 1.00022, 1.00016, 1.00022, 1.00016, 1.00022, 1.00001, 0.99973, 1, 1, 0.99973, 1, 1, 0.99955, 1.0006, 1.0006, 1.0006, 1.0006, 1, 1, 1, 0.99973, 0.99973, 0.99972, 1, 1, 1.00106, 0.99999, 0.99998, 0.99998, 0.99999, 0.99998, 1.66475, 1, 0.99973, 0.99973, 1.00023, 0.99973, 0.99971, 1.00047, 1.00023, 1, 0.99991, 0.99984, 1.00002, 1.00002, 1.00002, 1.00002, 1, 1, 1, 1, 1, 1, 1, 0.99972, 1, 1.20985, 1.39713, 1.00003, 1.00031, 1.00015, 1, 0.99561, 1.00027, 1.00031, 1.00031, 0.99915, 1.00031, 1.00031, 0.99999, 1.00003, 0.99999, 0.99999, 1.41144, 1.6, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.40579, 1.40579, 1.36625, 0.99999, 1, 0.99861, 0.99861, 1, 1.00026, 1.00026, 1.00026, 1.00026, 0.99972, 0.99999, 0.99999, 0.99999, 0.99999, 1.40483, 1, 0.99977, 1.00054, 1, 1, 0.99953, 0.99962, 1.00042, 0.9995, 1, 1, 1, 1, 1, 1, 1, 1, 0.99998, 0.99998, 0.99998, 0.99998, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const HelveticaBoldMetrics = {
  lineHeight: 1.2,
  lineGap: 0.2
};
const HelveticaBoldItalicFactors = [0.76116, 1, 1, 1.0006, 0.99998, 0.99974, 0.99973, 0.99973, 0.99982, 0.99977, 1.00087, 0.99998, 0.99998, 0.99959, 1.00003, 1.0006, 0.99998, 1.0006, 1.0006, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99998, 1, 1.00003, 1.00003, 1.00003, 1.00026, 0.9999, 0.99977, 0.99977, 0.99977, 0.99977, 1.00001, 1.00026, 1.00022, 0.99977, 1.0006, 0.99973, 0.99977, 1.00026, 0.99999, 0.99977, 1.00022, 1.00001, 1.00022, 0.99977, 1.00001, 1.00026, 0.99977, 1.00001, 1.00016, 1.00001, 1.00001, 1.00026, 0.99998, 1.0006, 0.99998, 1.00003, 0.99973, 0.99998, 0.99973, 1.00026, 0.99973, 1.00026, 0.99973, 0.99998, 1.00026, 1.00026, 1.0006, 1.0006, 0.99973, 1.0006, 0.99982, 1.00026, 1.00026, 1.00026, 1.00026, 0.99959, 0.99973, 0.99998, 1.00026, 0.99973, 1.00022, 0.99973, 0.99973, 1, 0.99959, 1.00077, 0.99959, 1.00003, 0.99998, 0.99973, 0.99973, 0.99973, 0.99973, 1.00077, 0.99973, 0.99998, 1.00025, 0.99968, 0.99973, 1.00003, 1.00025, 0.60299, 1.00024, 1.06409, 1, 1, 0.99998, 1, 0.99973, 1.0006, 0.99998, 1, 0.99936, 0.99973, 1.00002, 1.00002, 1.00002, 1.00026, 0.99977, 0.99977, 0.99977, 0.99977, 0.99977, 0.99977, 1, 0.99977, 1.00001, 1.00001, 1.00001, 1.00001, 1.0006, 1.0006, 1.0006, 1.0006, 0.99977, 0.99977, 1.00022, 1.00022, 1.00022, 1.00022, 1.00022, 1.00003, 1.00022, 0.99977, 0.99977, 0.99977, 0.99977, 1.00001, 1.00001, 1.00026, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99982, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 1.0006, 1.0006, 1.0006, 1.0006, 1.00026, 1.00026, 1.00026, 1.00026, 1.00026, 1.00026, 1.00026, 1.06409, 1.00026, 1.00026, 1.00026, 1.00026, 1.00026, 0.99973, 1.00026, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 1.0044, 0.99977, 1.00026, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00022, 1.00026, 1.00022, 1.00026, 1.00022, 1.00026, 1.00022, 1.00026, 0.99977, 1.00026, 0.99977, 1.00026, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 0.99971, 0.99973, 0.99973, 1.0006, 0.99977, 0.99973, 0.99973, 1.00026, 1.0006, 1.00026, 1.0006, 1.00026, 1.01011, 1.00026, 0.99999, 1.00026, 1.0006, 0.99977, 1.00026, 0.99977, 1.00026, 0.99977, 1.00026, 0.9993, 0.9998, 1.00026, 1.00022, 1.00026, 1.00022, 1.00026, 1.00022, 1.00026, 1, 1.00016, 0.99977, 0.99959, 0.99977, 0.99959, 0.99977, 0.99959, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00026, 0.99998, 1.00026, 0.8121, 1.00026, 0.99998, 0.99977, 1.00026, 0.99977, 1.00026, 0.99977, 1.00026, 0.99977, 1.00026, 0.99977, 1.00026, 0.99977, 1.00026, 1.00016, 1.00022, 1.00001, 0.99973, 1.00001, 1.00026, 1, 1.00026, 1, 1.00026, 1, 1.0006, 0.99973, 0.99977, 0.99973, 1, 0.99982, 1.00022, 1.00026, 1.00001, 0.99973, 1.00026, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99977, 1, 1, 1.00026, 0.99969, 0.99972, 0.99981, 0.9998, 1.0006, 0.99977, 0.99977, 1.00022, 0.91155, 1.00001, 1.00026, 0.99977, 1.00022, 1.0006, 0.99977, 1.00001, 0.99999, 0.99977, 0.99966, 1.00022, 1.00032, 1.00001, 0.99944, 1.00026, 1.00001, 0.99968, 1.00001, 1.00047, 1, 1.0006, 1.00001, 0.99981, 1.00101, 1.00026, 1.0006, 0.99948, 0.99981, 1.00064, 0.99973, 0.99942, 1.00101, 1.00061, 1.00026, 1.00069, 1.0006, 1.00014, 0.99973, 1.01322, 0.99973, 1.00065, 1.00026, 1.00012, 0.99923, 1, 1.00064, 1.00076, 0.99948, 1.00055, 1.00063, 1.00007, 0.99943, 1.0006, 0.99948, 1.00026, 0.99948, 0.99943, 1.00001, 1.00001, 1.00029, 1.00038, 1.00035, 1.00001, 1.0006, 1.0006, 0.99973, 0.99978, 1.00001, 1.00057, 0.99989, 0.99967, 0.99964, 0.99967, 0.99977, 0.99999, 0.99977, 1.00038, 0.99977, 1.00001, 0.99973, 1.00066, 0.99967, 0.99967, 1.00041, 0.99998, 0.99999, 0.99977, 1.00022, 0.99967, 1.00001, 0.99977, 1.00026, 0.99964, 1.00031, 1.00001, 0.99999, 0.99999, 1, 1.00023, 1, 1, 0.99999, 1.00035, 1.00001, 0.99999, 0.99973, 0.99977, 0.99999, 1.00058, 0.99973, 0.99973, 0.99955, 0.9995, 1.00026, 1.00026, 1.00032, 0.99989, 1.00034, 0.99999, 1.00026, 1.00026, 1.00026, 0.99973, 0.45998, 0.99973, 1.00026, 0.99973, 1.00001, 0.99999, 0.99982, 0.99994, 0.99996, 1, 1.00042, 1.00044, 1.00029, 1.00023, 0.99973, 0.99973, 1.00026, 0.99949, 1.00002, 0.99973, 1.0006, 1.0006, 1.0006, 0.99975, 1.00026, 1.00026, 1.00032, 0.98685, 0.99973, 1.00026, 1, 1, 0.99966, 1.00044, 1.00016, 1.00022, 1.00016, 1.00022, 1.00016, 1.00022, 1.00001, 0.99973, 1, 1, 0.99973, 1, 1, 0.99955, 1.0006, 1.0006, 1.0006, 1.0006, 1, 1, 1, 0.99973, 0.99973, 0.99972, 1, 1, 1.00106, 0.99999, 0.99998, 0.99998, 0.99999, 0.99998, 1.66475, 1, 0.99973, 0.99973, 1, 0.99973, 0.99971, 0.99978, 1, 1, 0.99991, 0.99984, 1.00002, 1.00002, 1.00002, 1.00002, 1.00098, 1, 1, 1, 1.00049, 1, 1, 0.99972, 1, 1.20985, 1.39713, 1.00003, 1.00031, 1.00015, 1, 0.99561, 1.00027, 1.00031, 1.00031, 0.99915, 1.00031, 1.00031, 0.99999, 1.00003, 0.99999, 0.99999, 1.41144, 1.6, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.40579, 1.40579, 1.36625, 0.99999, 1, 0.99861, 0.99861, 1, 1.00026, 1.00026, 1.00026, 1.00026, 0.99972, 0.99999, 0.99999, 0.99999, 0.99999, 1.40483, 1, 0.99977, 1.00054, 1, 1, 0.99953, 0.99962, 1.00042, 0.9995, 1, 1, 1, 1, 1, 1, 1, 1, 0.99998, 0.99998, 0.99998, 0.99998, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const HelveticaBoldItalicMetrics = {
  lineHeight: 1.35,
  lineGap: 0.2
};
const HelveticaItalicFactors = [0.76116, 1, 1, 1.0006, 1.0006, 1.00006, 0.99973, 0.99973, 0.99982, 1.00001, 1.00043, 0.99998, 0.99998, 0.99959, 1.00003, 1.0006, 0.99998, 1.0006, 1.0006, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 1.0006, 1, 1.00003, 1.00003, 1.00003, 0.99973, 0.99987, 1.00001, 1.00001, 0.99977, 0.99977, 1.00001, 1.00026, 1.00022, 0.99977, 1.0006, 1, 1.00001, 0.99973, 0.99999, 0.99977, 1.00022, 1.00001, 1.00022, 0.99977, 1.00001, 1.00026, 0.99977, 1.00001, 1.00016, 1.00001, 1.00001, 1.00026, 1.0006, 1.0006, 1.0006, 0.99949, 0.99973, 0.99998, 0.99973, 0.99973, 1, 0.99973, 0.99973, 1.0006, 0.99973, 0.99973, 0.99924, 0.99924, 1, 0.99924, 0.99999, 0.99973, 0.99973, 0.99973, 0.99973, 0.99998, 1, 1.0006, 0.99973, 1, 0.99977, 1, 1, 1, 1.00005, 1.0009, 1.00005, 1.00003, 0.99998, 0.99973, 0.99973, 0.99973, 0.99973, 1.0009, 0.99973, 0.99998, 1.00025, 0.99968, 0.99973, 1.00003, 1.00025, 0.60299, 1.00024, 1.06409, 1, 1, 0.99998, 1, 0.9998, 1.0006, 0.99998, 1, 0.99936, 0.99973, 1.00002, 1.00002, 1.00002, 1.00026, 1.00001, 1.00001, 1.00001, 1.00001, 1.00001, 1.00001, 1, 0.99977, 1.00001, 1.00001, 1.00001, 1.00001, 1.0006, 1.0006, 1.0006, 1.0006, 0.99977, 0.99977, 1.00022, 1.00022, 1.00022, 1.00022, 1.00022, 1.00003, 1.00022, 0.99977, 0.99977, 0.99977, 0.99977, 1.00001, 1.00001, 1.00026, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99982, 1, 0.99973, 0.99973, 0.99973, 0.99973, 1.0006, 1.0006, 1.0006, 1.0006, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 1.06409, 1.00026, 0.99973, 0.99973, 0.99973, 0.99973, 1, 0.99973, 1, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 0.99977, 1, 0.99977, 1, 0.99977, 1, 0.99977, 1, 0.99977, 1.0288, 0.99977, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00022, 0.99973, 1.00022, 0.99973, 1.00022, 0.99973, 1.00022, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 0.99924, 1.0006, 1.0006, 0.99946, 1.00034, 1, 0.99924, 1.00001, 1, 1, 0.99973, 0.99924, 0.99973, 0.99924, 0.99973, 1.06311, 0.99973, 1.00024, 0.99973, 0.99924, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 1.00041, 0.9998, 0.99973, 1.00022, 0.99973, 1.00022, 0.99973, 1.00022, 0.99973, 1, 1.00016, 0.99977, 0.99998, 0.99977, 0.99998, 0.99977, 0.99998, 1.00001, 1, 1.00001, 1, 1.00001, 1, 1.00001, 1, 1.00026, 1.0006, 1.00026, 0.89547, 1.00026, 1.0006, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 1.00016, 0.99977, 1.00001, 1, 1.00001, 1.00026, 1, 1.00026, 1, 1.00026, 1, 0.99924, 0.99973, 1.00001, 0.99973, 1, 0.99982, 1.00022, 1.00026, 1.00001, 1, 1.00026, 1.0006, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 1.00001, 1, 1.00054, 0.99977, 1.00084, 1.00007, 0.99973, 1.00013, 0.99924, 1.00001, 1.00001, 0.99945, 0.91221, 1.00001, 1.00026, 0.99977, 1.00022, 1.0006, 1.00001, 1.00001, 0.99999, 0.99977, 0.99933, 1.00022, 1.00054, 1.00001, 1.00065, 1.00026, 1.00001, 1.0001, 1.00001, 1.00052, 1, 1.0006, 1.00001, 0.99945, 0.99897, 0.99968, 0.99924, 1.00036, 0.99945, 0.99949, 1, 1.0006, 0.99897, 0.99918, 0.99968, 0.99911, 0.99924, 1, 0.99962, 1.01487, 1, 1.0005, 0.99973, 1.00012, 1.00043, 1, 0.99995, 0.99994, 1.00036, 0.99947, 1.00019, 1.00063, 1.00025, 0.99924, 1.00036, 0.99973, 1.00036, 1.00025, 1.00001, 1.00001, 1.00027, 1.0001, 1.00068, 1.00001, 1.0006, 1.0006, 1, 1.00008, 0.99957, 0.99972, 0.9994, 0.99954, 0.99975, 1.00051, 1.00001, 1.00019, 1.00001, 1.0001, 0.99986, 1.00001, 1.00001, 1.00038, 0.99954, 0.99954, 0.9994, 1.00066, 0.99999, 0.99977, 1.00022, 1.00054, 1.00001, 0.99977, 1.00026, 0.99975, 1.0001, 1.00001, 0.99993, 0.9995, 0.99955, 1.00016, 0.99978, 0.99974, 1.00019, 1.00022, 0.99955, 1.00053, 0.99973, 1.00089, 1.00005, 0.99967, 1.00048, 0.99973, 1.00002, 1.00034, 0.99973, 0.99973, 0.99964, 1.00006, 1.00066, 0.99947, 0.99973, 0.98894, 0.99973, 1, 0.44898, 1, 0.99946, 1, 1.00039, 1.00082, 0.99991, 0.99991, 0.99985, 1.00022, 1.00023, 1.00061, 1.00006, 0.99966, 0.99973, 0.99973, 0.99973, 1.00019, 1.0008, 1, 0.99924, 0.99924, 0.99924, 0.99983, 1.00044, 0.99973, 0.99964, 0.98332, 1, 0.99973, 1, 1, 0.99962, 0.99895, 1.00016, 0.99977, 1.00016, 0.99977, 1.00016, 0.99977, 1.00001, 1, 1, 1, 0.99973, 1, 1, 0.99955, 0.99924, 0.99924, 0.99924, 0.99924, 0.99998, 0.99998, 0.99998, 0.99973, 0.99973, 0.99972, 1, 1, 1.00267, 0.99999, 0.99998, 0.99998, 1, 0.99998, 1.66475, 1, 0.99973, 0.99973, 1.00023, 0.99973, 1.00423, 0.99925, 0.99999, 1, 0.99991, 0.99984, 1.00002, 1.00002, 1.00002, 1.00002, 1.00049, 1, 1.00245, 1, 1, 1, 1, 0.96329, 1, 1.20985, 1.39713, 1.00003, 0.8254, 1.00015, 1, 1.00035, 1.00027, 1.00031, 1.00031, 1.00003, 1.00031, 1.00031, 0.99999, 1.00003, 0.99999, 0.99999, 1.41144, 1.6, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.40579, 1.40579, 1.36625, 0.99999, 1, 0.99861, 0.99861, 1, 1.00026, 1.00026, 1.00026, 1.00026, 0.95317, 0.99999, 0.99999, 0.99999, 0.99999, 1.40483, 1, 0.99977, 1.00054, 1, 1, 0.99953, 0.99962, 1.00042, 0.9995, 1, 1, 1, 1, 1, 1, 1, 1, 0.99998, 0.99998, 0.99998, 0.99998, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const HelveticaItalicMetrics = {
  lineHeight: 1.35,
  lineGap: 0.2
};
const HelveticaRegularFactors = [0.76116, 1, 1, 1.0006, 1.0006, 1.00006, 0.99973, 0.99973, 0.99982, 1.00001, 1.00043, 0.99998, 0.99998, 0.99959, 1.00003, 1.0006, 0.99998, 1.0006, 1.0006, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 1.0006, 1, 1.00003, 1.00003, 1.00003, 0.99973, 0.99987, 1.00001, 1.00001, 0.99977, 0.99977, 1.00001, 1.00026, 1.00022, 0.99977, 1.0006, 1, 1.00001, 0.99973, 0.99999, 0.99977, 1.00022, 1.00001, 1.00022, 0.99977, 1.00001, 1.00026, 0.99977, 1.00001, 1.00016, 1.00001, 1.00001, 1.00026, 1.0006, 1.0006, 1.0006, 0.99949, 0.99973, 0.99998, 0.99973, 0.99973, 1, 0.99973, 0.99973, 1.0006, 0.99973, 0.99973, 0.99924, 0.99924, 1, 0.99924, 0.99999, 0.99973, 0.99973, 0.99973, 0.99973, 0.99998, 1, 1.0006, 0.99973, 1, 0.99977, 1, 1, 1, 1.00005, 1.0009, 1.00005, 1.00003, 0.99998, 0.99973, 0.99973, 0.99973, 0.99973, 1.0009, 0.99973, 0.99998, 1.00025, 0.99968, 0.99973, 1.00003, 1.00025, 0.60299, 1.00024, 1.06409, 1, 1, 0.99998, 1, 0.9998, 1.0006, 0.99998, 1, 0.99936, 0.99973, 1.00002, 1.00002, 1.00002, 1.00026, 1.00001, 1.00001, 1.00001, 1.00001, 1.00001, 1.00001, 1, 0.99977, 1.00001, 1.00001, 1.00001, 1.00001, 1.0006, 1.0006, 1.0006, 1.0006, 0.99977, 0.99977, 1.00022, 1.00022, 1.00022, 1.00022, 1.00022, 1.00003, 1.00022, 0.99977, 0.99977, 0.99977, 0.99977, 1.00001, 1.00001, 1.00026, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99982, 1, 0.99973, 0.99973, 0.99973, 0.99973, 1.0006, 1.0006, 1.0006, 1.0006, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 0.99973, 1.06409, 1.00026, 0.99973, 0.99973, 0.99973, 0.99973, 1, 0.99973, 1, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 0.99977, 1, 0.99977, 1, 0.99977, 1, 0.99977, 1, 0.99977, 1.04596, 0.99977, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00001, 0.99973, 1.00022, 0.99973, 1.00022, 0.99973, 1.00022, 0.99973, 1.00022, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 1.0006, 0.99924, 1.0006, 1.0006, 1.00019, 1.00034, 1, 0.99924, 1.00001, 1, 1, 0.99973, 0.99924, 0.99973, 0.99924, 0.99973, 1.02572, 0.99973, 1.00005, 0.99973, 0.99924, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99999, 0.9998, 0.99973, 1.00022, 0.99973, 1.00022, 0.99973, 1.00022, 0.99973, 1, 1.00016, 0.99977, 0.99998, 0.99977, 0.99998, 0.99977, 0.99998, 1.00001, 1, 1.00001, 1, 1.00001, 1, 1.00001, 1, 1.00026, 1.0006, 1.00026, 0.84533, 1.00026, 1.0006, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 0.99977, 0.99973, 1.00016, 0.99977, 1.00001, 1, 1.00001, 1.00026, 1, 1.00026, 1, 1.00026, 1, 0.99924, 0.99973, 1.00001, 0.99973, 1, 0.99982, 1.00022, 1.00026, 1.00001, 1, 1.00026, 1.0006, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99998, 0.99928, 1, 0.99977, 1.00013, 1.00055, 0.99947, 0.99945, 0.99941, 0.99924, 1.00001, 1.00001, 1.0004, 0.91621, 1.00001, 1.00026, 0.99977, 1.00022, 1.0006, 1.00001, 1.00005, 0.99999, 0.99977, 1.00015, 1.00022, 0.99977, 1.00001, 0.99973, 1.00026, 1.00001, 1.00019, 1.00001, 0.99946, 1, 1.0006, 1.00001, 0.99978, 1.00045, 0.99973, 0.99924, 1.00023, 0.99978, 0.99966, 1, 1.00065, 1.00045, 1.00019, 0.99973, 0.99973, 0.99924, 1, 1, 0.96499, 1, 1.00055, 0.99973, 1.00008, 1.00027, 1, 0.9997, 0.99995, 1.00023, 0.99933, 1.00019, 1.00015, 1.00031, 0.99924, 1.00023, 0.99973, 1.00023, 1.00031, 1.00001, 0.99928, 1.00029, 1.00092, 1.00035, 1.00001, 1.0006, 1.0006, 1, 0.99988, 0.99975, 1, 1.00082, 0.99561, 0.9996, 1.00035, 1.00001, 0.99962, 1.00001, 1.00092, 0.99964, 1.00001, 0.99963, 0.99999, 1.00035, 1.00035, 1.00082, 0.99962, 0.99999, 0.99977, 1.00022, 1.00035, 1.00001, 0.99977, 1.00026, 0.9996, 0.99967, 1.00001, 1.00034, 1.00074, 1.00054, 1.00053, 1.00063, 0.99971, 0.99962, 1.00035, 0.99975, 0.99977, 0.99973, 1.00043, 0.99953, 1.0007, 0.99915, 0.99973, 1.00008, 0.99892, 1.00073, 1.00073, 1.00114, 0.99915, 1.00073, 0.99955, 0.99973, 1.00092, 0.99973, 1, 0.99998, 1, 1.0003, 1, 1.00043, 1.00001, 0.99969, 1.0003, 1, 1.00035, 1.00001, 0.9995, 1, 1.00092, 0.99973, 0.99973, 0.99973, 1.0007, 0.9995, 1, 0.99924, 1.0006, 0.99924, 0.99972, 1.00062, 0.99973, 1.00114, 1.00073, 1, 0.99955, 1, 1, 1.00047, 0.99968, 1.00016, 0.99977, 1.00016, 0.99977, 1.00016, 0.99977, 1.00001, 1, 1, 1, 0.99973, 1, 1, 0.99955, 0.99924, 0.99924, 0.99924, 0.99924, 0.99998, 0.99998, 0.99998, 0.99973, 0.99973, 0.99972, 1, 1, 1.00267, 0.99999, 0.99998, 0.99998, 1, 0.99998, 1.66475, 1, 0.99973, 0.99973, 1.00023, 0.99973, 0.99971, 0.99925, 1.00023, 1, 0.99991, 0.99984, 1.00002, 1.00002, 1.00002, 1.00002, 1, 1, 1, 1, 1, 1, 1, 0.96329, 1, 1.20985, 1.39713, 1.00003, 0.8254, 1.00015, 1, 1.00035, 1.00027, 1.00031, 1.00031, 0.99915, 1.00031, 1.00031, 0.99999, 1.00003, 0.99999, 0.99999, 1.41144, 1.6, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.41144, 1.40579, 1.40579, 1.36625, 0.99999, 1, 0.99861, 0.99861, 1, 1.00026, 1.00026, 1.00026, 1.00026, 0.95317, 0.99999, 0.99999, 0.99999, 0.99999, 1.40483, 1, 0.99977, 1.00054, 1, 1, 0.99953, 0.99962, 1.00042, 0.9995, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const HelveticaRegularMetrics = {
  lineHeight: 1.2,
  lineGap: 0.2
};

;// ./src/core/liberationsans_widths.js
const LiberationSansBoldWidths = [365, 0, 333, 278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 737, 552, 400, 549, 333, 333, 333, 576, 556, 278, 333, 333, 365, 556, 83