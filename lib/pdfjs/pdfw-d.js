        value = this.value.text[$getExtra]();
        } else {
          const htmlValue = this.value[$toHTML]().html;
          if (htmlValue !== null) {
            value = htmlValue.children[0].value;
          }
        }
        if (this.ui.textEdit && this.value.text?.maxChars) {
          ui.children[0].attributes.maxLength = this.value.text.maxChars;
        }
        if (value) {
          if (this.ui.numericEdit) {
            value = parseFloat(value);
            value = isNaN(value) ? "" : value.toString();
          }
          if (ui.children[0].name === "textarea") {
            ui.children[0].attributes.textContent = value;
          } else {
            ui.children[0].attributes.value = value;
          }
        }
      }
    }
    if (!this.ui.imageEdit && ui.children?.[0] && this.h) {
      borderDims = borderDims || getBorderDims(this.ui[$getExtra]());
      let captionHeight = 0;
      if (this.caption && ["top", "bottom"].includes(this.caption.placement)) {
        captionHeight = this.caption.reserve;
        if (captionHeight <= 0) {
          captionHeight = this.caption[$getExtra](availableSpace).h;
        }
        const inputHeight = this.h - captionHeight - marginV - borderDims.h;
        ui.children[0].attributes.style.height = measureToString(inputHeight);
      } else {
        ui.children[0].attributes.style.height = "100%";
      }
    }
    if (aElement) {
      ui.children.push(aElement);
    }
    if (!caption) {
      if (ui.attributes.class) {
        ui.attributes.class.push("xfaLeft");
      }
      this.w = savedW;
      this.h = savedH;
      return HTMLResult.success(createWrapper(this, html), bbox);
    }
    if (this.ui.button) {
      if (style.padding) {
        delete style.padding;
      }
      if (caption.name === "div") {
        caption.name = "span";
      }
      ui.children.push(caption);
      return HTMLResult.success(html, bbox);
    } else if (this.ui.checkButton) {
      caption.attributes.class[0] = "xfaCaptionForCheckButton";
    }
    ui.attributes.class ||= [];
    ui.children.splice(0, 0, caption);
    switch (this.caption.placement) {
      case "left":
        ui.attributes.class.push("xfaLeft");
        break;
      case "right":
        ui.attributes.class.push("xfaRight");
        break;
      case "top":
        ui.attributes.class.push("xfaTop");
        break;
      case "bottom":
        ui.attributes.class.push("xfaBottom");
        break;
      case "inline":
        ui.attributes.class.push("xfaLeft");
        break;
    }
    this.w = savedW;
    this.h = savedH;
    return HTMLResult.success(createWrapper(this, html), bbox);
  }
}
class Fill extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "fill", true);
    this.id = attributes.id || "";
    this.presence = getStringOption(attributes.presence, ["visible", "hidden", "inactive", "invisible"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.color = null;
    this.extras = null;
    this.linear = null;
    this.pattern = null;
    this.radial = null;
    this.solid = null;
    this.stipple = null;
  }
  [$toStyle]() {
    const parent = this[$getParent]();
    const grandpa = parent[$getParent]();
    const ggrandpa = grandpa[$getParent]();
    const style = Object.create(null);
    let propName = "color";
    let altPropName = propName;
    if (parent instanceof Border) {
      propName = "background-color";
      altPropName = "background";
      if (ggrandpa instanceof Ui) {
        style.backgroundColor = "white";
      }
    }
    if (parent instanceof Rectangle || parent instanceof Arc) {
      propName = altPropName = "fill";
      style.fill = "white";
    }
    for (const name of Object.getOwnPropertyNames(this)) {
      if (name === "extras" || name === "color") {
        continue;
      }
      const obj = this[name];
      if (!(obj instanceof XFAObject)) {
        continue;
      }
      const color = obj[$toStyle](this.color);
      if (color) {
        style[color.startsWith("#") ? propName : altPropName] = color;
      }
      return style;
    }
    if (this.color?.value) {
      const color = this.color[$toStyle]();
      style[color.startsWith("#") ? propName : altPropName] = color;
    }
    return style;
  }
}
class Filter extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "filter", true);
    this.addRevocationInfo = getStringOption(attributes.addRevocationInfo, ["", "required", "optional", "none"]);
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.version = getInteger({
      data: this.version,
      defaultValue: 5,
      validate: x => x >= 1 && x <= 5
    });
    this.appearanceFilter = null;
    this.certificates = null;
    this.digestMethods = null;
    this.encodings = null;
    this.encryptionMethods = null;
    this.handler = null;
    this.lockDocument = null;
    this.mdp = null;
    this.reasons = null;
    this.timeStamp = null;
  }
}
class Float extends ContentObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "float");
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
  [$finalize]() {
    const number = parseFloat(this[$content].trim());
    this[$content] = isNaN(number) ? null : number;
  }
  [$toHTML](availableSpace) {
    return valueToHtml(this[$content] !== null ? this[$content].toString() : "");
  }
}
class template_Font extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "font", true);
    this.baselineShift = getMeasurement(attributes.baselineShift);
    this.fontHorizontalScale = getFloat({
      data: attributes.fontHorizontalScale,
      defaultValue: 100,
      validate: x => x >= 0
    });
    this.fontVerticalScale = getFloat({
      data: attributes.fontVerticalScale,
      defaultValue: 100,
      validate: x => x >= 0
    });
    this.id = attributes.id || "";
    this.kerningMode = getStringOption(attributes.kerningMode, ["none", "pair"]);
    this.letterSpacing = getMeasurement(attributes.letterSpacing, "0");
    this.lineThrough = getInteger({
      data: attributes.lineThrough,
      defaultValue: 0,
      validate: x => x === 1 || x === 2
    });
    this.lineThroughPeriod = getStringOption(attributes.lineThroughPeriod, ["all", "word"]);
    this.overline = getInteger({
      data: attributes.overline,
      defaultValue: 0,
      validate: x => x === 1 || x === 2
    });
    this.overlinePeriod = getStringOption(attributes.overlinePeriod, ["all", "word"]);
    this.posture = getStringOption(attributes.posture, ["normal", "italic"]);
    this.size = getMeasurement(attributes.size, "10pt");
    this.typeface = attributes.typeface || "Courier";
    this.underline = getInteger({
      data: attributes.underline,
      defaultValue: 0,
      validate: x => x === 1 || x === 2
    });
    this.underlinePeriod = getStringOption(attributes.underlinePeriod, ["all", "word"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.weight = getStringOption(attributes.weight, ["normal", "bold"]);
    this.extras = null;
    this.fill = null;
  }
  [$clean](builder) {
    super[$clean](builder);
    this[$globalData].usedTypefaces.add(this.typeface);
  }
  [$toStyle]() {
    const style = toStyle(this, "fill");
    const color = style.color;
    if (color) {
      if (color === "#000000") {
        delete style.color;
      } else if (!color.startsWith("#")) {
        style.background = color;
        style.backgroundClip = "text";
        style.color = "transparent";
      }
    }
    if (this.baselineShift) {
      style.verticalAlign = measureToString(this.baselineShift);
    }
    style.fontKerning = this.kerningMode === "none" ? "none" : "normal";
    style.letterSpacing = measureToString(this.letterSpacing);
    if (this.lineThrough !== 0) {
      style.textDecoration = "line-through";
      if (this.lineThrough === 2) {
        style.textDecorationStyle = "double";
      }
    }
    if (this.overline !== 0) {
      style.textDecoration = "overline";
      if (this.overline === 2) {
        style.textDecorationStyle = "double";
      }
    }
    style.fontStyle = this.posture;
    style.fontSize = measureToString(0.99 * this.size);
    setFontFamily(this, this, this[$globalData].fontFinder, style);
    if (this.underline !== 0) {
      style.textDecoration = "underline";
      if (this.underline === 2) {
        style.textDecorationStyle = "double";
      }
    }
    style.fontWeight = this.weight;
    return style;
  }
}
class Format extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "format", true);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.extras = null;
    this.picture = null;
  }
}
class Handler extends StringObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "handler");
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class Hyphenation extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "hyphenation");
    this.excludeAllCaps = getInteger({
      data: attributes.excludeAllCaps,
      defaultValue: 0,
      validate: x => x === 1
    });
    this.excludeInitialCap = getInteger({
      data: attributes.excludeInitialCap,
      defaultValue: 0,
      validate: x => x === 1
    });
    this.hyphenate = getInteger({
      data: attributes.hyphenate,
      defaultValue: 0,
      validate: x => x === 1
    });
    this.id = attributes.id || "";
    this.pushCharacterCount = getInteger({
      data: attributes.pushCharacterCount,
      defaultValue: 3,
      validate: x => x >= 0
    });
    this.remainCharacterCount = getInteger({
      data: attributes.remainCharacterCount,
      defaultValue: 3,
      validate: x => x >= 0
    });
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.wordCharacterCount = getInteger({
      data: attributes.wordCharacterCount,
      defaultValue: 7,
      validate: x => x >= 0
    });
  }
}
class Image extends StringObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "image");
    this.aspect = getStringOption(attributes.aspect, ["fit", "actual", "height", "none", "width"]);
    this.contentType = attributes.contentType || "";
    this.href = attributes.href || "";
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.transferEncoding = getStringOption(attributes.transferEncoding, ["base64", "none", "package"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
  [$toHTML]() {
    if (this.contentType && !MIMES.has(this.contentType.toLowerCase())) {
      return HTMLResult.EMPTY;
    }
    let buffer = this[$globalData].images?.get(this.href);
    if (!buffer && (this.href || !this[$content])) {
      return HTMLResult.EMPTY;
    }
    if (!buffer && this.transferEncoding === "base64") {
      buffer = fromBase64Util(this[$content]);
    }
    if (!buffer) {
      return HTMLResult.EMPTY;
    }
    if (!this.contentType) {
      for (const [header, type] of IMAGES_HEADERS) {
        if (buffer.length > header.length && header.every((x, i) => x === buffer[i])) {
          this.contentType = type;
          break;
        }
      }
      if (!this.contentType) {
        return HTMLResult.EMPTY;
      }
    }
    const blob = new Blob([buffer], {
      type: this.contentType
    });
    let style;
    switch (this.aspect) {
      case "fit":
      case "actual":
        break;
      case "height":
        style = {
          height: "100%",
          objectFit: "fill"
        };
        break;
      case "none":
        style = {
          width: "100%",
          height: "100%",
          objectFit: "fill"
        };
        break;
      case "width":
        style = {
          width: "100%",
          objectFit: "fill"
        };
        break;
    }
    const parent = this[$getParent]();
    return HTMLResult.success({
      name: "img",
      attributes: {
        class: ["xfaImage"],
        style,
        src: URL.createObjectURL(blob),
        alt: parent ? ariaLabel(parent[$getParent]()) : null
      }
    });
  }
}
class ImageEdit extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "imageEdit", true);
    this.data = getStringOption(attributes.data, ["link", "embed"]);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.border = null;
    this.extras = null;
    this.margin = null;
  }
  [$toHTML](availableSpace) {
    if (this.data === "embed") {
      return HTMLResult.success({
        name: "div",
        children: [],
        attributes: {}
      });
    }
    return HTMLResult.EMPTY;
  }
}
class Integer extends ContentObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "integer");
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
  [$finalize]() {
    const number = parseInt(this[$content].trim(), 10);
    this[$content] = isNaN(number) ? null : number;
  }
  [$toHTML](availableSpace) {
    return valueToHtml(this[$content] !== null ? this[$content].toString() : "");
  }
}
class Issuers extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "issuers", true);
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.certificate = new XFAObjectArray();
  }
}
class Items extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "items", true);
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.presence = getStringOption(attributes.presence, ["visible", "hidden", "inactive", "invisible"]);
    this.ref = attributes.ref || "";
    this.save = getInteger({
      data: attributes.save,
      defaultValue: 0,
      validate: x => x === 1
    });
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.boolean = new XFAObjectArray();
    this.date = new XFAObjectArray();
    this.dateTime = new XFAObjectArray();
    this.decimal = new XFAObjectArray();
    this.exData = new XFAObjectArray();
    this.float = new XFAObjectArray();
    this.image = new XFAObjectArray();
    this.integer = new XFAObjectArray();
    this.text = new XFAObjectArray();
    this.time = new XFAObjectArray();
  }
  [$toHTML]() {
    const output = [];
    for (const child of this[$getChildren]()) {
      output.push(child[$text]());
    }
    return HTMLResult.success(output);
  }
}
class Keep extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "keep", true);
    this.id = attributes.id || "";
    const options = ["none", "contentArea", "pageArea"];
    this.intact = getStringOption(attributes.intact, options);
    this.next = getStringOption(attributes.next, options);
    this.previous = getStringOption(attributes.previous, options);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.extras = null;
  }
}
class KeyUsage extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "keyUsage");
    const options = ["", "yes", "no"];
    this.crlSign = getStringOption(attributes.crlSign, options);
    this.dataEncipherment = getStringOption(attributes.dataEncipherment, options);
    this.decipherOnly = getStringOption(attributes.decipherOnly, options);
    this.digitalSignature = getStringOption(attributes.digitalSignature, options);
    this.encipherOnly = getStringOption(attributes.encipherOnly, options);
    this.id = attributes.id || "";
    this.keyAgreement = getStringOption(attributes.keyAgreement, options);
    this.keyCertSign = getStringOption(attributes.keyCertSign, options);
    this.keyEncipherment = getStringOption(attributes.keyEncipherment, options);
    this.nonRepudiation = getStringOption(attributes.nonRepudiation, options);
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class Line extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "line", true);
    this.hand = getStringOption(attributes.hand, ["even", "left", "right"]);
    this.id = attributes.id || "";
    this.slope = getStringOption(attributes.slope, ["\\", "/"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.edge = null;
  }
  [$toHTML]() {
    const parent = this[$getParent]()[$getParent]();
    const edge = this.edge || new Edge({});
    const edgeStyle = edge[$toStyle]();
    const style = Object.create(null);
    const thickness = edge.presence === "visible" ? edge.thickness : 0;
    style.strokeWidth = measureToString(thickness);
    style.stroke = edgeStyle.color;
    let x1, y1, x2, y2;
    let width = "100%";
    let height = "100%";
    if (parent.w <= thickness) {
      [x1, y1, x2, y2] = ["50%", 0, "50%", "100%"];
      width = style.strokeWidth;
    } else if (parent.h <= thickness) {
      [x1, y1, x2, y2] = [0, "50%", "100%", "50%"];
      height = style.strokeWidth;
    } else if (this.slope === "\\") {
      [x1, y1, x2, y2] = [0, 0, "100%", "100%"];
    } else {
      [x1, y1, x2, y2] = [0, "100%", "100%", 0];
    }
    const line = {
      name: "line",
      attributes: {
        xmlns: SVG_NS,
        x1,
        y1,
        x2,
        y2,
        style
      }
    };
    const svg = {
      name: "svg",
      children: [line],
      attributes: {
        xmlns: SVG_NS,
        width,
        height,
        style: {
          overflow: "visible"
        }
      }
    };
    if (hasMargin(parent)) {
      return HTMLResult.success({
        name: "div",
        attributes: {
          style: {
            display: "inline",
            width: "100%",
            height: "100%"
          }
        },
        children: [svg]
      });
    }
    svg.attributes.style.position = "absolute";
    return HTMLResult.success(svg);
  }
}
class Linear extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "linear", true);
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["toRight", "toBottom", "toLeft", "toTop"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.color = null;
    this.extras = null;
  }
  [$toStyle](startColor) {
    startColor = startColor ? startColor[$toStyle]() : "#FFFFFF";
    const transf = this.type.replace(/([RBLT])/, " $1").toLowerCase();
    const endColor = this.color ? this.color[$toStyle]() : "#000000";
    return `linear-gradient(${transf}, ${startColor}, ${endColor})`;
  }
}
class LockDocument extends ContentObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "lockDocument");
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
  [$finalize]() {
    this[$content] = getStringOption(this[$content], ["auto", "0", "1"]);
  }
}
class Manifest extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "manifest", true);
    this.action = getStringOption(attributes.action, ["include", "all", "exclude"]);
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.extras = null;
    this.ref = new XFAObjectArray();
  }
}
class Margin extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "margin", true);
    this.bottomInset = getMeasurement(attributes.bottomInset, "0");
    this.id = attributes.id || "";
    this.leftInset = getMeasurement(attributes.leftInset, "0");
    this.rightInset = getMeasurement(attributes.rightInset, "0");
    this.topInset = getMeasurement(attributes.topInset, "0");
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.extras = null;
  }
  [$toStyle]() {
    return {
      margin: measureToString(this.topInset) + " " + measureToString(this.rightInset) + " " + measureToString(this.bottomInset) + " " + measureToString(this.leftInset)
    };
  }
}
class Mdp extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "mdp");
    this.id = attributes.id || "";
    this.permissions = getInteger({
      data: attributes.permissions,
      defaultValue: 2,
      validate: x => x === 1 || x === 3
    });
    this.signatureType = getStringOption(attributes.signatureType, ["filler", "author"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class Medium extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "medium");
    this.id = attributes.id || "";
    this.imagingBBox = getBBox(attributes.imagingBBox);
    this.long = getMeasurement(attributes.long);
    this.orientation = getStringOption(attributes.orientation, ["portrait", "landscape"]);
    this.short = getMeasurement(attributes.short);
    this.stock = attributes.stock || "";
    this.trayIn = getStringOption(attributes.trayIn, ["auto", "delegate", "pageFront"]);
    this.trayOut = getStringOption(attributes.trayOut, ["auto", "delegate"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class Message extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "message", true);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.text = new XFAObjectArray();
  }
}
class NumericEdit extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "numericEdit", true);
    this.hScrollPolicy = getStringOption(attributes.hScrollPolicy, ["auto", "off", "on"]);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.border = null;
    this.comb = null;
    this.extras = null;
    this.margin = null;
  }
  [$toHTML](availableSpace) {
    const style = toStyle(this, "border", "font", "margin");
    const field = this[$getParent]()[$getParent]();
    const html = {
      name: "input",
      attributes: {
        type: "text",
        fieldId: field[$uid],
        dataId: field[$data]?.[$uid] || field[$uid],
        class: ["xfaTextfield"],
        style,
        "aria-label": ariaLabel(field),
        "aria-required": false
      }
    };
    if (isRequired(field)) {
      html.attributes["aria-required"] = true;
      html.attributes.required = true;
    }
    return HTMLResult.success({
      name: "label",
      attributes: {
        class: ["xfaLabel"]
      },
      children: [html]
    });
  }
}
class Occur extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "occur", true);
    this.id = attributes.id || "";
    this.initial = attributes.initial !== "" ? getInteger({
      data: attributes.initial,
      defaultValue: "",
      validate: x => true
    }) : "";
    this.max = attributes.max !== "" ? getInteger({
      data: attributes.max,
      defaultValue: 1,
      validate: x => true
    }) : "";
    this.min = attributes.min !== "" ? getInteger({
      data: attributes.min,
      defaultValue: 1,
      validate: x => true
    }) : "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.extras = null;
  }
  [$clean]() {
    const parent = this[$getParent]();
    const originalMin = this.min;
    if (this.min === "") {
      this.min = parent instanceof PageArea || parent instanceof PageSet ? 0 : 1;
    }
    if (this.max === "") {
      if (originalMin === "") {
        this.max = parent instanceof PageArea || parent instanceof PageSet ? -1 : 1;
      } else {
        this.max = this.min;
      }
    }
    if (this.max !== -1 && this.max < this.min) {
      this.max = this.min;
    }
    if (this.initial === "") {
      this.initial = parent instanceof Template ? 1 : this.min;
    }
  }
}
class Oid extends StringObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "oid");
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class Oids extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "oids", true);
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.oid = new XFAObjectArray();
  }
}
class Overflow extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "overflow");
    this.id = attributes.id || "";
    this.leader = attributes.leader || "";
    this.target = attributes.target || "";
    this.trailer = attributes.trailer || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
  [$getExtra]() {
    if (!this[$extra]) {
      const parent = this[$getParent]();
      const root = this[$getTemplateRoot]();
      const target = root[$searchNode](this.target, parent);
      const leader = root[$searchNode](this.leader, parent);
      const trailer = root[$searchNode](this.trailer, parent);
      this[$extra] = {
        target: target?.[0] || null,
        leader: leader?.[0] || null,
        trailer: trailer?.[0] || null,
        addLeader: false,
        addTrailer: false
      };
    }
    return this[$extra];
  }
}
class PageArea extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "pageArea", true);
    this.blankOrNotBlank = getStringOption(attributes.blankOrNotBlank, ["any", "blank", "notBlank"]);
    this.id = attributes.id || "";
    this.initialNumber = getInteger({
      data: attributes.initialNumber,
      defaultValue: 1,
      validate: x => true
    });
    this.name = attributes.name || "";
    this.numbered = getInteger({
      data: attributes.numbered,
      defaultValue: 1,
      validate: x => true
    });
    this.oddOrEven = getStringOption(attributes.oddOrEven, ["any", "even", "odd"]);
    this.pagePosition = getStringOption(attributes.pagePosition, ["any", "first", "last", "only", "rest"]);
    this.relevant = getRelevant(attributes.relevant);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.desc = null;
    this.extras = null;
    this.medium = null;
    this.occur = null;
    this.area = new XFAObjectArray();
    this.contentArea = new XFAObjectArray();
    this.draw = new XFAObjectArray();
    this.exclGroup = new XFAObjectArray();
    this.field = new XFAObjectArray();
    this.subform = new XFAObjectArray();
  }
  [$isUsable]() {
    if (!this[$extra]) {
      this[$extra] = {
        numberOfUse: 0
      };
      return true;
    }
    return !this.occur || this.occur.max === -1 || this[$extra].numberOfUse < this.occur.max;
  }
  [$cleanPage]() {
    delete this[$extra];
  }
  [$getNextPage]() {
    this[$extra] ||= {
      numberOfUse: 0
    };
    const parent = this[$getParent]();
    if (parent.relation === "orderedOccurrence") {
      if (this[$isUsable]()) {
        this[$extra].numberOfUse += 1;
        return this;
      }
    }
    return parent[$getNextPage]();
  }
  [$getAvailableSpace]() {
    return this[$extra].space || {
      width: 0,
      height: 0
    };
  }
  [$toHTML]() {
    this[$extra] ||= {
      numberOfUse: 1
    };
    const children = [];
    this[$extra].children = children;
    const style = Object.create(null);
    if (this.medium && this.medium.short && this.medium.long) {
      style.width = measureToString(this.medium.short);
      style.height = measureToString(this.medium.long);
      this[$extra].space = {
        width: this.medium.short,
        height: this.medium.long
      };
      if (this.medium.orientation === "landscape") {
        const x = style.width;
        style.width = style.height;
        style.height = x;
        this[$extra].space = {
          width: this.medium.long,
          height: this.medium.short
        };
      }
    } else {
      warn("XFA - No medium specified in pageArea: please file a bug.");
    }
    this[$childrenToHTML]({
      filter: new Set(["area", "draw", "field", "subform"]),
      include: true
    });
    this[$childrenToHTML]({
      filter: new Set(["contentArea"]),
      include: true
    });
    return HTMLResult.success({
      name: "div",
      children,
      attributes: {
        class: ["xfaPage"],
        id: this[$uid],
        style,
        xfaName: this.name
      }
    });
  }
}
class PageSet extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "pageSet", true);
    this.duplexImposition = getStringOption(attributes.duplexImposition, ["longEdge", "shortEdge"]);
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.relation = getStringOption(attributes.relation, ["orderedOccurrence", "duplexPaginated", "simplexPaginated"]);
    this.relevant = getRelevant(attributes.relevant);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.extras = null;
    this.occur = null;
    this.pageArea = new XFAObjectArray();
    this.pageSet = new XFAObjectArray();
  }
  [$cleanPage]() {
    for (const page of this.pageArea.children) {
      page[$cleanPage]();
    }
    for (const page of this.pageSet.children) {
      page[$cleanPage]();
    }
  }
  [$isUsable]() {
    return !this.occur || this.occur.max === -1 || this[$extra].numberOfUse < this.occur.max;
  }
  [$getNextPage]() {
    this[$extra] ||= {
      numberOfUse: 1,
      pageIndex: -1,
      pageSetIndex: -1
    };
    if (this.relation === "orderedOccurrence") {
      if (this[$extra].pageIndex + 1 < this.pageArea.children.length) {
        this[$extra].pageIndex += 1;
        const pageArea = this.pageArea.children[this[$extra].pageIndex];
        return pageArea[$getNextPage]();
      }
      if (this[$extra].pageSetIndex + 1 < this.pageSet.children.length) {
        this[$extra].pageSetIndex += 1;
        return this.pageSet.children[this[$extra].pageSetIndex][$getNextPage]();
      }
      if (this[$isUsable]()) {
        this[$extra].numberOfUse += 1;
        this[$extra].pageIndex = -1;
        this[$extra].pageSetIndex = -1;
        return this[$getNextPage]();
      }
      const parent = this[$getParent]();
      if (parent instanceof PageSet) {
        return parent[$getNextPage]();
      }
      this[$cleanPage]();
      return this[$getNextPage]();
    }
    const pageNumber = this[$getTemplateRoot]()[$extra].pageNumber;
    const parity = pageNumber % 2 === 0 ? "even" : "odd";
    const position = pageNumber === 0 ? "first" : "rest";
    let page = this.pageArea.children.find(p => p.oddOrEven === parity && p.pagePosition === position);
    if (page) {
      return page;
    }
    page = this.pageArea.children.find(p => p.oddOrEven === "any" && p.pagePosition === position);
    if (page) {
      return page;
    }
    page = this.pageArea.children.find(p => p.oddOrEven === "any" && p.pagePosition === "any");
    if (page) {
      return page;
    }
    return this.pageArea.children[0];
  }
}
class Para extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "para", true);
    this.hAlign = getStringOption(attributes.hAlign, ["left", "center", "justify", "justifyAll", "radix", "right"]);
    this.id = attributes.id || "";
    this.lineHeight = attributes.lineHeight ? getMeasurement(attributes.lineHeight, "0pt") : "";
    this.marginLeft = attributes.marginLeft ? getMeasurement(attributes.marginLeft, "0pt") : "";
    this.marginRight = attributes.marginRight ? getMeasurement(attributes.marginRight, "0pt") : "";
    this.orphans = getInteger({
      data: attributes.orphans,
      defaultValue: 0,
      validate: x => x >= 0
    });
    this.preserve = attributes.preserve || "";
    this.radixOffset = attributes.radixOffset ? getMeasurement(attributes.radixOffset, "0pt") : "";
    this.spaceAbove = attributes.spaceAbove ? getMeasurement(attributes.spaceAbove, "0pt") : "";
    this.spaceBelow = attributes.spaceBelow ? getMeasurement(attributes.spaceBelow, "0pt") : "";
    this.tabDefault = attributes.tabDefault ? getMeasurement(this.tabDefault) : "";
    this.tabStops = (attributes.tabStops || "").trim().split(/\s+/).map((x, i) => i % 2 === 1 ? getMeasurement(x) : x);
    this.textIndent = attributes.textIndent ? getMeasurement(attributes.textIndent, "0pt") : "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.vAlign = getStringOption(attributes.vAlign, ["top", "bottom", "middle"]);
    this.widows = getInteger({
      data: attributes.widows,
      defaultValue: 0,
      validate: x => x >= 0
    });
    this.hyphenation = null;
  }
  [$toStyle]() {
    const style = toStyle(this, "hAlign");
    if (this.marginLeft !== "") {
      style.paddingLeft = measureToString(this.marginLeft);
    }
    if (this.marginRight !== "") {
      style.paddingRight = measureToString(this.marginRight);
    }
    if (this.spaceAbove !== "") {
      style.paddingTop = measureToString(this.spaceAbove);
    }
    if (this.spaceBelow !== "") {
      style.paddingBottom = measureToString(this.spaceBelow);
    }
    if (this.textIndent !== "") {
      style.textIndent = measureToString(this.textIndent);
      fixTextIndent(style);
    }
    if (this.lineHeight > 0) {
      style.lineHeight = measureToString(this.lineHeight);
    }
    if (this.tabDefault !== "") {
      style.tabSize = measureToString(this.tabDefault);
    }
    if (this.tabStops.length > 0) {}
    if (this.hyphenatation) {
      Object.assign(style, this.hyphenatation[$toStyle]());
    }
    return style;
  }
}
class PasswordEdit extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "passwordEdit", true);
    this.hScrollPolicy = getStringOption(attributes.hScrollPolicy, ["auto", "off", "on"]);
    this.id = attributes.id || "";
    this.passwordChar = attributes.passwordChar || "*";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.border = null;
    this.extras = null;
    this.margin = null;
  }
}
class template_Pattern extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "pattern", true);
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["crossHatch", "crossDiagonal", "diagonalLeft", "diagonalRight", "horizontal", "vertical"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.color = null;
    this.extras = null;
  }
  [$toStyle](startColor) {
    startColor = startColor ? startColor[$toStyle]() : "#FFFFFF";
    const endColor = this.color ? this.color[$toStyle]() : "#000000";
    const width = 5;
    const cmd = "repeating-linear-gradient";
    const colors = `${startColor},${startColor} ${width}px,${endColor} ${width}px,${endColor} ${2 * width}px`;
    switch (this.type) {
      case "crossHatch":
        return `${cmd}(to top,${colors}) ${cmd}(to right,${colors})`;
      case "crossDiagonal":
        return `${cmd}(45deg,${colors}) ${cmd}(-45deg,${colors})`;
      case "diagonalLeft":
        return `${cmd}(45deg,${colors})`;
      case "diagonalRight":
        return `${cmd}(-45deg,${colors})`;
      case "horizontal":
        return `${cmd}(to top,${colors})`;
      case "vertical":
        return `${cmd}(to right,${colors})`;
    }
    return "";
  }
}
class Picture extends StringObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "picture");
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class Proto extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "proto", true);
    this.appearanceFilter = new XFAObjectArray();
    this.arc = new XFAObjectArray();
    this.area = new XFAObjectArray();
    this.assist = new XFAObjectArray();
    this.barcode = new XFAObjectArray();
    this.bindItems = new XFAObjectArray();
    this.bookend = new XFAObjectArray();
    this.boolean = new XFAObjectArray();
    this.border = new XFAObjectArray();
    this.break = new XFAObjectArray();
    this.breakAfter = new XFAObjectArray();
    this.breakBefore = new XFAObjectArray();
    this.button = new XFAObjectArray();
    this.calculate = new XFAObjectArray();
    this.caption = new XFAObjectArray();
    this.certificate = new XFAObjectArray();
    this.certificates = new XFAObjectArray();
    this.checkButton = new XFAObjectArray();
    this.choiceList = new XFAObjectArray();
    this.color = new XFAObjectArray();
    this.comb = new XFAObjectArray();
    this.connect = new XFAObjectArray();
    this.contentArea = new XFAObjectArray();
    this.corner = new XFAObjectArray();
    this.date = new XFAObjectArray();
    this.dateTime = new XFAObjectArray();
    this.dateTimeEdit = new XFAObjectArray();
    this.decimal = new XFAObjectArray();
    this.defaultUi = new XFAObjectArray();
    this.desc = new XFAObjectArray();
    this.digestMethod = new XFAObjectArray();
    this.digestMethods = new XFAObjectArray();
    this.draw = new XFAObjectArray();
    this.edge = new XFAObjectArray();
    this.encoding = new XFAObjectArray();
    this.encodings = new XFAObjectArray();
    this.encrypt = new XFAObjectArray();
    this.encryptData = new XFAObjectArray();
    this.encryption = new XFAObjectArray();
    this.encryptionMethod = new XFAObjectArray();
    this.encryptionMethods = new XFAObjectArray();
    this.event = new XFAObjectArray();
    this.exData = new XFAObjectArray();
    this.exObject = new XFAObjectArray();
    this.exclGroup = new XFAObjectArray();
    this.execute = new XFAObjectArray();
    this.extras = new XFAObjectArray();
    this.field = new XFAObjectArray();
    this.fill = new XFAObjectArray();
    this.filter = new XFAObjectArray();
    this.float = new XFAObjectArray();
    this.font = new XFAObjectArray();
    this.format = new XFAObjectArray();
    this.handler = new XFAObjectArray();
    this.hyphenation = new XFAObjectArray();
    this.image = new XFAObjectArray();
    this.imageEdit = new XFAObjectArray();
    this.integer = new XFAObjectArray();
    this.issuers = new XFAObjectArray();
    this.items = new XFAObjectArray();
    this.keep = new XFAObjectArray();
    this.keyUsage = new XFAObjectArray();
    this.line = new XFAObjectArray();
    this.linear = new XFAObjectArray();
    this.lockDocument = new XFAObjectArray();
    this.manifest = new XFAObjectArray();
    this.margin = new XFAObjectArray();
    this.mdp = new XFAObjectArray();
    this.medium = new XFAObjectArray();
    this.message = new XFAObjectArray();
    this.numericEdit = new XFAObjectArray();
    this.occur = new XFAObjectArray();
    this.oid = new XFAObjectArray();
    this.oids = new XFAObjectArray();
    this.overflow = new XFAObjectArray();
    this.pageArea = new XFAObjectArray();
    this.pageSet = new XFAObjectArray();
    this.para = new XFAObjectArray();
    this.passwordEdit = new XFAObjectArray();
    this.pattern = new XFAObjectArray();
    this.picture = new XFAObjectArray();
    this.radial = new XFAObjectArray();
    this.reason = new XFAObjectArray();
    this.reasons = new XFAObjectArray();
    this.rectangle = new XFAObjectArray();
    this.ref = new XFAObjectArray();
    this.script = new XFAObjectArray();
    this.setProperty = new XFAObjectArray();
    this.signData = new XFAObjectArray();
    this.signature = new XFAObjectArray();
    this.signing = new XFAObjectArray();
    this.solid = new XFAObjectArray();
    this.speak = new XFAObjectArray();
    this.stipple = new XFAObjectArray();
    this.subform = new XFAObjectArray();
    this.subformSet = new XFAObjectArray();
    this.subjectDN = new XFAObjectArray();
    this.subjectDNs = new XFAObjectArray();
    this.submit = new XFAObjectArray();
    this.text = new XFAObjectArray();
    this.textEdit = new XFAObjectArray();
    this.time = new XFAObjectArray();
    this.timeStamp = new XFAObjectArray();
    this.toolTip = new XFAObjectArray();
    this.traversal = new XFAObjectArray();
    this.traverse = new XFAObjectArray();
    this.ui = new XFAObjectArray();
    this.validate = new XFAObjectArray();
    this.value = new XFAObjectArray();
    this.variables = new XFAObjectArray();
  }
}
class Radial extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "radial", true);
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["toEdge", "toCenter"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.color = null;
    this.extras = null;
  }
  [$toStyle](startColor) {
    startColor = startColor ? startColor[$toStyle]() : "#FFFFFF";
    const endColor = this.color ? this.color[$toStyle]() : "#000000";
    const colors = this.type === "toEdge" ? `${startColor},${endColor}` : `${endColor},${startColor}`;
    return `radial-gradient(circle at center, ${colors})`;
  }
}
class Reason extends StringObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "reason");
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class Reasons extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "reasons", true);
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.reason = new XFAObjectArray();
  }
}
class Rectangle extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "rectangle", true);
    this.hand = getStringOption(attributes.hand, ["even", "left", "right"]);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.corner = new XFAObjectArray(4);
    this.edge = new XFAObjectArray(4);
    this.fill = null;
  }
  [$toHTML]() {
    const edge = this.edge.children.length ? this.edge.children[0] : new Edge({});
    const edgeStyle = edge[$toStyle]();
    const style = Object.create(null);
    if (this.fill?.presence === "visible") {
      Object.assign(style, this.fill[$toStyle]());
    } else {
      style.fill = "transparent";
    }
    style.strokeWidth = measureToString(edge.presence === "visible" ? edge.thickness : 0);
    style.stroke = edgeStyle.color;
    const corner = this.corner.children.length ? this.corner.children[0] : new Corner({});
    const cornerStyle = corner[$toStyle]();
    const rect = {
      name: "rect",
      attributes: {
        xmlns: SVG_NS,
        width: "100%",
        height: "100%",
        x: 0,
        y: 0,
        rx: cornerStyle.radius,
        ry: cornerStyle.radius,
        style
      }
    };
    const svg = {
      name: "svg",
      children: [rect],
      attributes: {
        xmlns: SVG_NS,
        style: {
          overflow: "visible"
        },
        width: "100%",
        height: "100%"
      }
    };
    const parent = this[$getParent]()[$getParent]();
    if (hasMargin(parent)) {
      return HTMLResult.success({
        name: "div",
        attributes: {
          style: {
            display: "inline",
            width: "100%",
            height: "100%"
          }
        },
        children: [svg]
      });
    }
    svg.attributes.style.position = "absolute";
    return HTMLResult.success(svg);
  }
}
class RefElement extends StringObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "ref");
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class Script extends StringObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "script");
    this.binding = attributes.binding || "";
    this.contentType = attributes.contentType || "";
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.runAt = getStringOption(attributes.runAt, ["client", "both", "server"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class SetProperty extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "setProperty");
    this.connection = attributes.connection || "";
    this.ref = attributes.ref || "";
    this.target = attributes.target || "";
  }
}
class SignData extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "signData", true);
    this.id = attributes.id || "";
    this.operation = getStringOption(attributes.operation, ["sign", "clear", "verify"]);
    this.ref = attributes.ref || "";
    this.target = attributes.target || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.filter = null;
    this.manifest = null;
  }
}
class Signature extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "signature", true);
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["PDF1.3", "PDF1.6"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.border = null;
    this.extras = null;
    this.filter = null;
    this.manifest = null;
    this.margin = null;
  }
}
class Signing extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "signing", true);
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.certificate = new XFAObjectArray();
  }
}
class Solid extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "solid", true);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.extras = null;
  }
  [$toStyle](startColor) {
    return startColor ? startColor[$toStyle]() : "#FFFFFF";
  }
}
class Speak extends StringObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "speak");
    this.disable = getInteger({
      data: attributes.disable,
      defaultValue: 0,
      validate: x => x === 1
    });
    this.id = attributes.id || "";
    this.priority = getStringOption(attributes.priority, ["custom", "caption", "name", "toolTip"]);
    this.rid = attributes.rid || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class Stipple extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "stipple", true);
    this.id = attributes.id || "";
    this.rate = getInteger({
      data: attributes.rate,
      defaultValue: 50,
      validate: x => x >= 0 && x <= 100
    });
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.color = null;
    this.extras = null;
  }
  [$toStyle](bgColor) {
    const alpha = this.rate / 100;
    return Util.makeHexColor(Math.round(bgColor.value.r * (1 - alpha) + this.value.r * alpha), Math.round(bgColor.value.g * (1 - alpha) + this.value.g * alpha), Math.round(bgColor.value.b * (1 - alpha) + this.value.b * alpha));
  }
}
class Subform extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "subform", true);
    this.access = getStringOption(attributes.access, ["open", "nonInteractive", "protected", "readOnly"]);
    this.allowMacro = getInteger({
      data: attributes.allowMacro,
      defaultValue: 0,
      validate: x => x === 1
    });
    this.anchorType = getStringOption(attributes.anchorType, ["topLeft", "bottomCenter", "bottomLeft", "bottomRight", "middleCenter", "middleLeft", "middleRight", "topCenter", "topRight"]);
    this.colSpan = getInteger({
      data: attributes.colSpan,
      defaultValue: 1,
      validate: n => n >= 1 || n === -1
    });
    this.columnWidths = (attributes.columnWidths || "").trim().split(/\s+/).map(x => x === "-1" ? -1 : getMeasurement(x));
    this.h = attributes.h ? getMeasurement(attributes.h) : "";
    this.hAlign = getStringOption(attributes.hAlign, ["left", "center", "justify", "justifyAll", "radix", "right"]);
    this.id = attributes.id || "";
    this.layout = getStringOption(attributes.layout, ["position", "lr-tb", "rl-row", "rl-tb", "row", "table", "tb"]);
    this.locale = attributes.locale || "";
    this.maxH = getMeasurement(attributes.maxH, "0pt");
    this.maxW = getMeasurement(attributes.maxW, "0pt");
    this.mergeMode = getStringOption(attributes.mergeMode, ["consumeData", "matchTemplate"]);
    this.minH = getMeasurement(attributes.minH, "0pt");
    this.minW = getMeasurement(attributes.minW, "0pt");
    this.name = attributes.name || "";
    this.presence = getStringOption(attributes.presence, ["visible", "hidden", "inactive", "invisible"]);
    this.relevant = getRelevant(attributes.relevant);
    this.restoreState = getStringOption(attributes.restoreState, ["manual", "auto"]);
    this.scope = getStringOption(attributes.scope, ["name", "none"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.w = attributes.w ? getMeasurement(attributes.w) : "";
    this.x = getMeasurement(attributes.x, "0pt");
    this.y = getMeasurement(attributes.y, "0pt");
    this.assist = null;
    this.bind = null;
    this.bookend = null;
    this.border = null;
    this.break = null;
    this.calculate = null;
    this.desc = null;
    this.extras = null;
    this.keep = null;
    this.margin = null;
    this.occur = null;
    this.overflow = null;
    this.pageSet = null;
    this.para = null;
    this.traversal = null;
    this.validate = null;
    this.variables = null;
    this.area = new XFAObjectArray();
    this.breakAfter = new XFAObjectArray();
    this.breakBefore = new XFAObjectArray();
    this.connect = new XFAObjectArray();
    this.draw = new XFAObjectArray();
    this.event = new XFAObjectArray();
    this.exObject = new XFAObjectArray();
    this.exclGroup = new XFAObjectArray();
    this.field = new XFAObjectArray();
    this.proto = new XFAObjectArray();
    this.setProperty = new XFAObjectArray();
    this.subform = new XFAObjectArray();
    this.subformSet = new XFAObjectArray();
  }
  [$getSubformParent]() {
    const parent = this[$getParent]();
    if (parent instanceof SubformSet) {
      return parent[$getSubformParent]();
    }
    return parent;
  }
  [$isBindable]() {
    return true;
  }
  [$isThereMoreWidth]() {
    return this.layout.endsWith("-tb") && this[$extra].attempt === 0 && this[$extra].numberInLine > 0 || this[$getParent]()[$isThereMoreWidth]();
  }
  *[$getContainedChildren]() {
    yield* getContainedChildren(this);
  }
  [$flushHTML]() {
    return flushHTML(this);
  }
  [$addHTML](html, bbox) {
    addHTML(this, html, bbox);
  }
  [$getAvailableSpace]() {
    return getAvailableSpace(this);
  }
  [$isSplittable]() {
    const parent = this[$getSubformParent]();
    if (!parent[$isSplittable]()) {
      return false;
    }
    if (this[$extra]._isSplittable !== undefined) {
      return this[$extra]._isSplittable;
    }
    if (this.layout === "position" || this.layout.includes("row")) {
      this[$extra]._isSplittable = false;
      return false;
    }
    if (this.keep && this.keep.intact !== "none") {
      this[$extra]._isSplittable = false;
      return false;
    }
    if (parent.layout?.endsWith("-tb") && parent[$extra].numberInLine !== 0) {
      return false;
    }
    this[$extra]._isSplittable = true;
    return true;
  }
  [$toHTML](availableSpace) {
    setTabIndex(this);
    if (this.break) {
      if (this.break.after !== "auto" || this.break.afterTarget !== "") {
        const node = new BreakAfter({
          targetType: this.break.after,
          target: this.break.afterTarget,
          startNew: this.break.startNew.toString()
        });
        node[$globalData] = this[$globalData];
        this[$appendChild](node);
        this.breakAfter.push(node);
      }
      if (this.break.before !== "auto" || this.break.beforeTarget !== "") {
        const node = new BreakBefore({
          targetType: this.break.before,
          target: this.break.beforeTarget,
          startNew: this.break.startNew.toString()
        });
        node[$globalData] = this[$globalData];
        this[$appendChild](node);
        this.breakBefore.push(node);
      }
      if (this.break.overflowTarget !== "") {
        const node = new Overflow({
          target: this.break.overflowTarget,
          leader: this.break.overflowLeader,
          trailer: this.break.overflowTrailer
        });
        node[$globalData] = this[$globalData];
        this[$appendChild](node);
        this.overflow.push(node);
      }
      this[$removeChild](this.break);
      this.break = null;
    }
    if (this.presence === "hidden" || this.presence === "inactive") {
      return HTMLResult.EMPTY;
    }
    if (this.breakBefore.children.length > 1 || this.breakAfter.children.length > 1) {
      warn("XFA - Several breakBefore or breakAfter in subforms: please file a bug.");
    }
    if (this.breakBefore.children.length >= 1) {
      const breakBefore = this.breakBefore.children[0];
      if (handleBreak(breakBefore)) {
        return HTMLResult.breakNode(breakBefore);
      }
    }
    if (this[$extra]?.afterBreakAfter) {
      return HTMLResult.EMPTY;
    }
    fixDimensions(this);
    const children = [];
    const attributes = {
      id: this[$uid],
      class: []
    };
    setAccess(this, attributes.class);
    this[$extra] ||= Object.create(null);
    Object.assign(this[$extra], {
      children,
      line: null,
      attributes,
      attempt: 0,
      numberInLine: 0,
      availableSpace: {
        width: Math.min(this.w || Infinity, availableSpace.width),
        height: Math.min(this.h || Infinity, availableSpace.height)
      },
      width: 0,
      height: 0,
      prevHeight: 0,
      currentWidth: 0
    });
    const root = this[$getTemplateRoot]();
    const savedNoLayoutFailure = root[$extra].noLayoutFailure;
    const isSplittable = this[$isSplittable]();
    if (!isSplittable) {
      setFirstUnsplittable(this);
    }
    if (!checkDimensions(this, availableSpace)) {
      return HTMLResult.FAILURE;
    }
    const filter = new Set(["area", "draw", "exclGroup", "field", "subform", "subformSet"]);
    if (this.layout.includes("row")) {
      const columnWidths = this[$getSubformParent]().columnWidths;
      if (Array.isArray(columnWidths) && columnWidths.length > 0) {
        this[$extra].columnWidths = columnWidths;
        this[$extra].currentColumn = 0;
      }
    }
    const style = toStyle(this, "anchorType", "dimensions", "position", "presence", "border", "margin", "hAlign");
    const classNames = ["xfaSubform"];
    const cl = layoutClass(this);
    if (cl) {
      classNames.push(cl);
    }
    attributes.style = style;
    attributes.class = classNames;
    if (this.name) {
      attributes.xfaName = this.name;
    }
    if (this.overflow) {
      const overflowExtra = this.overflow[$getExtra]();
      if (overflowExtra.addLeader) {
        overflowExtra.addLeader = false;
        handleOverflow(this, overflowExtra.leader, availableSpace);
      }
    }
    this[$pushPara]();
    const isLrTb = this.layout === "lr-tb" || this.layout === "rl-tb";
    const maxRun = isLrTb ? MAX_ATTEMPTS_FOR_LRTB_LAYOUT : 1;
    for (; this[$extra].attempt < maxRun; this[$extra].attempt++) {
      if (isLrTb && this[$extra].attempt === MAX_ATTEMPTS_FOR_LRTB_LAYOUT - 1) {
        this[$extra].numberInLine = 0;
      }
      const result = this[$childrenToHTML]({
        filter,
        include: true
      });
      if (result.success) {
        break;
      }
      if (result.isBreak()) {
        this[$popPara]();
        return result;
      }
      if (isLrTb && this[$extra].attempt === 0 && this[$extra].numberInLine === 0 && !root[$extra].noLayoutFailure) {
        this[$extra].attempt = maxRun;
        break;
      }
    }
    this[$popPara]();
    if (!isSplittable) {
      unsetFirstUnsplittable(this);
    }
    root[$extra].noLayoutFailure = savedNoLayoutFailure;
    if (this[$extra].attempt === maxRun) {
      if (this.overflow) {
        this[$getTemplateRoot]()[$extra].overflowNode = this.overflow;
      }
      if (!isSplittable) {
        delete this[$extra];
      }
      return HTMLResult.FAILURE;
    }
    if (this.overflow) {
      const overflowExtra = this.overflow[$getExtra]();
      if (overflowExtra.addTrailer) {
        overflowExtra.addTrailer = false;
        handleOverflow(this, overflowExtra.trailer, availableSpace);
      }
    }
    let marginH = 0;
    let marginV = 0;
    if (this.margin) {
      marginH = this.margin.leftInset + this.margin.rightInset;
      marginV = this.margin.topInset + this.margin.bottomInset;
    }
    const width = Math.max(this[$extra].width + marginH, this.w || 0);
    const height = Math.max(this[$extra].height + marginV, this.h || 0);
    const bbox = [this.x, this.y, width, height];
    if (this.w === "") {
      style.width = measureToString(width);
    }
    if (this.h === "") {
      style.height = measureToString(height);
    }
    if ((style.width === "0px" || style.height === "0px") && children.length === 0) {
      return HTMLResult.EMPTY;
    }
    const html = {
      name: "div",
      attributes,
      children
    };
    applyAssist(this, attributes);
    const result = HTMLResult.success(createWrapper(this, html), bbox);
    if (this.breakAfter.children.length >= 1) {
      const breakAfter = this.breakAfter.children[0];
      if (handleBreak(breakAfter)) {
        this[$extra].afterBreakAfter = result;
        return HTMLResult.breakNode(breakAfter);
      }
    }
    delete this[$extra];
    return result;
  }
}
class SubformSet extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "subformSet", true);
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.relation = getStringOption(attributes.relation, ["ordered", "choice", "unordered"]);
    this.relevant = getRelevant(attributes.relevant);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.bookend = null;
    this.break = null;
    this.desc = null;
    this.extras = null;
    this.occur = null;
    this.overflow = null;
    this.breakAfter = new XFAObjectArray();
    this.breakBefore = new XFAObjectArray();
    this.subform = new XFAObjectArray();
    this.subformSet = new XFAObjectArray();
  }
  *[$getContainedChildren]() {
    yield* getContainedChildren(this);
  }
  [$getSubformParent]() {
    let parent = this[$getParent]();
    while (!(parent instanceof Subform)) {
      parent = parent[$getParent]();
    }
    return parent;
  }
  [$isBindable]() {
    return true;
  }
}
class SubjectDN extends ContentObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "subjectDN");
    this.delimiter = attributes.delimiter || ",";
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
  [$finalize]() {
    this[$content] = new Map(this[$content].split(this.delimiter).map(kv => {
      kv = kv.split("=", 2);
      kv[0] = kv[0].trim();
      return kv;
    }));
  }
}
class SubjectDNs extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "subjectDNs", true);
    this.id = attributes.id || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.subjectDN = new XFAObjectArray();
  }
}
class Submit extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "submit", true);
    this.embedPDF = getInteger({
      data: attributes.embedPDF,
      defaultValue: 0,
      validate: x => x === 1
    });
    this.format = getStringOption(attributes.format, ["xdp", "formdata", "pdf", "urlencoded", "xfd", "xml"]);
    this.id = attributes.id || "";
    this.target = attributes.target || "";
    this.textEncoding = getKeyword({
      data: attributes.textEncoding ? attributes.textEncoding.toLowerCase() : "",
      defaultValue: "",
      validate: k => ["utf-8", "big-five", "fontspecific", "gbk", "gb-18030", "gb-2312", "ksc-5601", "none", "shift-jis", "ucs-2", "utf-16"].includes(k) || k.match(/iso-8859-\d{2}/)
    });
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.xdpContent = attributes.xdpContent || "";
    this.encrypt = null;
    this.encryptData = new XFAObjectArray();
    this.signData = new XFAObjectArray();
  }
}
class Template extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "template", true);
    this.baseProfile = getStringOption(attributes.baseProfile, ["full", "interactiveForms"]);
    this.extras = null;
    this.subform = new XFAObjectArray();
  }
  [$finalize]() {
    if (this.subform.children.length === 0) {
      warn("XFA - No subforms in template node.");
    }
    if (this.subform.children.length >= 2) {
      warn("XFA - Several subforms in template node: please file a bug.");
    }
    this[$tabIndex] = DEFAULT_TAB_INDEX;
  }
  [$isSplittable]() {
    return true;
  }
  [$searchNode](expr, container) {
    if (expr.startsWith("#")) {
      return [this[$ids].get(expr.slice(1))];
    }
    return searchNode(this, container, expr, true, true);
  }
  *[$toPages]() {
    if (!this.subform.children.length) {
      return HTMLResult.success({
        name: "div",
        children: []
      });
    }
    this[$extra] = {
      overflowNode: null,
      firstUnsplittable: null,
      currentContentArea: null,
      currentPageArea: null,
      noLayoutFailure: false,
      pageNumber: 1,
      pagePosition: "first",
      oddOrEven: "odd",
      blankOrNotBlank: "nonBlank",
      paraStack: []
    };
    const root = this.subform.children[0];
    root.pageSet[$cleanPage]();
    const pageAreas = root.pageSet.pageArea.children;
    const mainHtml = {
      name: "div",
      children: []
    };
    let pageArea = null;
    let breakBefore = null;
    let breakBeforeTarget = null;
    if (root.breakBefore.children.length >= 1) {
      breakBefore = root.breakBefore.children[0];
      breakBeforeTarget = breakBefore.target;
    } else if (root.subform.children.length >= 1 && root.subform.children[0].breakBefore.children.length >= 1) {
      breakBefore = root.subform.children[0].breakBefore.children[0];
      breakBeforeTarget = breakBefore.target;
    } else if (root.break?.beforeTarget) {
      breakBefore = root.break;
      breakBeforeTarget = breakBefore.beforeTarget;
    } else if (root.subform.children.length >= 1 && root.subform.children[0].break?.beforeTarget) {
      breakBefore = root.subform.children[0].break;
      breakBeforeTarget = breakBefore.beforeTarget;
    }
    if (breakBefore) {
      const target = this[$searchNode](breakBeforeTarget, breakBefore[$getParent]());
      if (target instanceof PageArea) {
        pageArea = target;
        breakBefore[$extra] = {};
      }
    }
    pageArea ||= pageAreas[0];
    pageArea[$extra] = {
      numberOfUse: 1
    };
    const pageAreaParent = pageArea[$getParent]();
    pageAreaParent[$extra] = {
      numberOfUse: 1,
      pageIndex: pageAreaParent.pageArea.children.indexOf(pageArea),
      pageSetIndex: 0
    };
    let targetPageArea;
    let leader = null;
    let trailer = null;
    let hasSomething = true;
    let hasSomethingCounter = 0;
    let startIndex = 0;
    while (true) {
      if (!hasSomething) {
        mainHtml.children.pop();
        if (++hasSomethingCounter === MAX_EMPTY_PAGES) {
          warn("XFA - Something goes wrong: please file a bug.");
          return mainHtml;
        }
      } else {
        hasSomethingCounter = 0;
      }
      targetPageArea = null;
      this[$extra].currentPageArea = pageArea;
      const page = pageArea[$toHTML]().html;
      mainHtml.children.push(page);
      if (leader) {
        this[$extra].noLayoutFailure = true;
        page.children.push(leader[$toHTML](pageArea[$extra].space).html);
        leader = null;
      }
      if (trailer) {
        this[$extra].noLayoutFailure = true;
        page.children.push(trailer[$toHTML](pageArea[$extra].space).html);
        trailer = null;
      }
      const contentAreas = pageArea.contentArea.children;
      const htmlContentAreas = page.children.filter(node => node.attributes.class.includes("xfaContentarea"));
      hasSomething = false;
      this[$extra].firstUnsplittable = null;
      this[$extra].noLayoutFailure = false;
      const flush = index => {
        const html = root[$flushHTML]();
        if (html) {
          hasSomething ||= html.children?.length > 0;
          htmlContentAreas[index].children.push(html);
        }
      };
      for (let i = startIndex, ii = contentAreas.length; i < ii; i++) {
        const contentArea = this[$extra].currentContentArea = contentAreas[i];
        const space = {
          width: contentArea.w,
          height: contentArea.h
        };
        startIndex = 0;
        if (leader) {
          htmlContentAreas[i].children.push(leader[$toHTML](space).html);
          leader = null;
        }
        if (trailer) {
          htmlContentAreas[i].children.push(trailer[$toHTML](space).html);
          trailer = null;
        }
        const html = root[$toHTML](space);
        if (html.success) {
          if (html.html) {
            hasSomething ||= html.html.children?.length > 0;
            htmlContentAreas[i].children.push(html.html);
          } else if (!hasSomething && mainHtml.children.length > 1) {
            mainHtml.children.pop();
          }
          return mainHtml;
        }
        if (html.isBreak()) {
          const node = html.breakNode;
          flush(i);
          if (node.targetType === "auto") {
            continue;
          }
          if (node.leader) {
            leader = this[$searchNode](node.leader, node[$getParent]());
            leader = leader ? leader[0] : null;
          }
          if (node.trailer) {
            trailer = this[$searchNode](node.trailer, node[$getParent]());
            trailer = trailer ? trailer[0] : null;
          }
          if (node.targetType === "pageArea") {
            targetPageArea = node[$extra].target;
            i = Infinity;
          } else if (!node[$extra].target) {
            i = node[$extra].index;
          } else {
            targetPageArea = node[$extra].target;
            startIndex = node[$extra].index + 1;
            i = Infinity;
          }
          continue;
        }
        if (this[$extra].overflowNode) {
          const node = this[$extra].overflowNode;
          this[$extra].overflowNode = null;
          const overflowExtra = node[$getExtra]();
          const target = overflowExtra.target;
          overflowExtra.addLeader = overflowExtra.leader !== null;
          overflowExtra.addTrailer = overflowExtra.trailer !== null;
          flush(i);
          const currentIndex = i;
          i = Infinity;
          if (target instanceof PageArea) {
            targetPageArea = target;
          } else if (target instanceof ContentArea) {
            const index = contentAreas.indexOf(target);
            if (index !== -1) {
              if (index > currentIndex) {
                i = index - 1;
              } else {
                startIndex = index;
              }
            } else {
              targetPageArea = target[$getParent]();
              startIndex = targetPageArea.contentArea.children.indexOf(target);
            }
          }
          continue;
        }
        flush(i);
      }
      this[$extra].pageNumber += 1;
      if (targetPageArea) {
        if (targetPageArea[$isUsable]()) {
          targetPageArea[$extra].numberOfUse += 1;
        } else {
          targetPageArea = null;
        }
      }
      pageArea = targetPageArea || pageArea[$getNextPage]();
      yield null;
    }
  }
}
class Text extends ContentObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "text");
    this.id = attributes.id || "";
    this.maxChars = getInteger({
      data: attributes.maxChars,
      defaultValue: 0,
      validate: x => x >= 0
    });
    this.name = attributes.name || "";
    this.rid = attributes.rid || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
  [$acceptWhitespace]() {
    return true;
  }
  [$onChild](child) {
    if (child[$namespaceId] === NamespaceIds.xhtml.id) {
      this[$content] = child;
      return true;
    }
    warn(`XFA - Invalid content in Text: ${child[$nodeName]}.`);
    return false;
  }
  [$onText](str) {
    if (this[$content] instanceof XFAObject) {
      return;
    }
    super[$onText](str);
  }
  [$finalize]() {
    if (typeof this[$content] === "string") {
      this[$content] = this[$content].replaceAll("\r\n", "\n");
    }
  }
  [$getExtra]() {
    if (typeof this[$content] === "string") {
      return this[$content].split(/[\u2029\u2028\n]/).filter(line => !!line).join("\n");
    }
    return this[$content][$text]();
  }
  [$toHTML](availableSpace) {
    if (typeof this[$content] === "string") {
      const html = valueToHtml(this[$content]).html;
      if (this[$content].includes("\u2029")) {
        html.name = "div";
        html.children = [];
        this[$content].split("\u2029").map(para => para.split(/[\u2028\n]/).flatMap(line => [{
          name: "span",
          value: line
        }, {
          name: "br"
        }])).forEach(lines => {
          html.children.push({
            name: "p",
            children: lines
          });
        });
      } else if (/[\u2028\n]/.test(this[$content])) {
        html.name = "div";
        html.children = [];
        this[$content].split(/[\u2028\n]/).forEach(line => {
          html.children.push({
            name: "span",
            value: line
          }, {
            name: "br"
          });
        });
      }
      return HTMLResult.success(html);
    }
    return this[$content][$toHTML](availableSpace);
  }
}
class TextEdit extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "textEdit", true);
    this.allowRichText = getInteger({
      data: attributes.allowRichText,
      defaultValue: 0,
      validate: x => x === 1
    });
    this.hScrollPolicy = getStringOption(attributes.hScrollPolicy, ["auto", "off", "on"]);
    this.id = attributes.id || "";
    this.multiLine = getInteger({
      data: attributes.multiLine,
      defaultValue: "",
      validate: x => x === 0 || x === 1
    });
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.vScrollPolicy = getStringOption(attributes.vScrollPolicy, ["auto", "off", "on"]);
    this.border = null;
    this.comb = null;
    this.extras = null;
    this.margin = null;
  }
  [$toHTML](availableSpace) {
    const style = toStyle(this, "border", "font", "margin");
    let html;
    const field = this[$getParent]()[$getParent]();
    if (this.multiLine === "") {
      this.multiLine = field instanceof Draw ? 1 : 0;
    }
    if (this.multiLine === 1) {
      html = {
        name: "textarea",
        attributes: {
          dataId: field[$data]?.[$uid] || field[$uid],
          fieldId: field[$uid],
          class: ["xfaTextfield"],
          style,
          "aria-label": ariaLabel(field),
          "aria-required": false
        }
      };
    } else {
      html = {
        name: "input",
        attributes: {
          type: "text",
          dataId: field[$data]?.[$uid] || field[$uid],
          fieldId: field[$uid],
          class: ["xfaTextfield"],
          style,
          "aria-label": ariaLabel(field),
          "aria-required": false
        }
      };
    }
    if (isRequired(field)) {
      html.attributes["aria-required"] = true;
      html.attributes.required = true;
    }
    return HTMLResult.success({
      name: "label",
      attributes: {
        class: ["xfaLabel"]
      },
      children: [html]
    });
  }
}
class Time extends StringObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "time");
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
  [$finalize]() {
    const date = this[$content].trim();
    this[$content] = date ? new Date(date) : null;
  }
  [$toHTML](availableSpace) {
    return valueToHtml(this[$content] ? this[$content].toString() : "");
  }
}
class TimeStamp extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "timeStamp");
    this.id = attributes.id || "";
    this.server = attributes.server || "";
    this.type = getStringOption(attributes.type, ["optional", "required"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class ToolTip extends StringObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "toolTip");
    this.id = attributes.id || "";
    this.rid = attributes.rid || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class Traversal extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "traversal", true);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.extras = null;
    this.traverse = new XFAObjectArray();
  }
}
class Traverse extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "traverse", true);
    this.id = attributes.id || "";
    this.operation = getStringOption(attributes.operation, ["next", "back", "down", "first", "left", "right", "up"]);
    this.ref = attributes.ref || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.extras = null;
    this.script = null;
  }
  get name() {
    return this.operation;
  }
  [$isTransparent]() {
    return false;
  }
}
class Ui extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "ui", true);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.extras = null;
    this.picture = null;
    this.barcode = null;
    this.button = null;
    this.checkButton = null;
    this.choiceList = null;
    this.dateTimeEdit = null;
    this.defaultUi = null;
    this.imageEdit = null;
    this.numericEdit = null;
    this.passwordEdit = null;
    this.signature = null;
    this.textEdit = null;
  }
  [$getExtra]() {
    if (this[$extra] === undefined) {
      for (const name of Object.getOwnPropertyNames(this)) {
        if (name === "extras" || name === "picture") {
          continue;
        }
        const obj = this[name];
        if (!(obj instanceof XFAObject)) {
          continue;
        }
        this[$extra] = obj;
        return obj;
      }
      this[$extra] = null;
    }
    return this[$extra];
  }
  [$toHTML](availableSpace) {
    const obj = this[$getExtra]();
    if (obj) {
      return obj[$toHTML](availableSpace);
    }
    return HTMLResult.EMPTY;
  }
}
class Validate extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "validate", true);
    this.formatTest = getStringOption(attributes.formatTest, ["warning", "disabled", "error"]);
    this.id = attributes.id || "";
    this.nullTest = getStringOption(attributes.nullTest, ["disabled", "error", "warning"]);
    this.scriptTest = getStringOption(attributes.scriptTest, ["error", "disabled", "warning"]);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.extras = null;
    this.message = null;
    this.picture = null;
    this.script = null;
  }
}
class Value extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "value", true);
    this.id = attributes.id || "";
    this.override = getInteger({
      data: attributes.override,
      defaultValue: 0,
      validate: x => x === 1
    });
    this.relevant = getRelevant(attributes.relevant);
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.arc = null;
    this.boolean = null;
    this.date = null;
    this.dateTime = null;
    this.decimal = null;
    this.exData = null;
    this.float = null;
    this.image = null;
    this.integer = null;
    this.line = null;
    this.rectangle = null;
    this.text = null;
    this.time = null;
  }
  [$setValue](value) {
    const parent = this[$getParent]();
    if (parent instanceof Field) {
      if (parent.ui?.imageEdit) {
        if (!this.image) {
          this.image = new Image({});
          this[$appendChild](this.image);
        }
        this.image[$content] = value[$content];
        return;
      }
    }
    const valueName = value[$nodeName];
    if (this[valueName] !== null) {
      this[valueName][$content] = value[$content];
      return;
    }
    for (const name of Object.getOwnPropertyNames(this)) {
      const obj = this[name];
      if (obj instanceof XFAObject) {
        this[name] = null;
        this[$removeChild](obj);
      }
    }
    this[value[$nodeName]] = value;
    this[$appendChild](value);
  }
  [$text]() {
    if (this.exData) {
      if (typeof this.exData[$content] === "string") {
        return this.exData[$content].trim();
      }
      return this.exData[$content][$text]().trim();
    }
    for (const name of Object.getOwnPropertyNames(this)) {
      if (name === "image") {
        continue;
      }
      const obj = this[name];
      if (obj instanceof XFAObject) {
        return (obj[$content] || "").toString().trim();
      }
    }
    return null;
  }
  [$toHTML](availableSpace) {
    for (const name of Object.getOwnPropertyNames(this)) {
      const obj = this[name];
      if (!(obj instanceof XFAObject)) {
        continue;
      }
      return obj[$toHTML](availableSpace);
    }
    return HTMLResult.EMPTY;
  }
}
class Variables extends XFAObject {
  constructor(attributes) {
    super(TEMPLATE_NS_ID, "variables", true);
    this.id = attributes.id || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
    this.boolean = new XFAObjectArray();
    this.date = new XFAObjectArray();
    this.dateTime = new XFAObjectArray();
    this.decimal = new XFAObjectArray();
    this.exData = new XFAObjectArray();
    this.float = new XFAObjectArray();
    this.image = new XFAObjectArray();
    this.integer = new XFAObjectArray();
    this.manifest = new XFAObjectArray();
    this.script = new XFAObjectArray();
    this.text = new XFAObjectArray();
    this.time = new XFAObjectArray();
  }
  [$isTransparent]() {
    return true;
  }
}
class TemplateNamespace {
  static [$buildXFAObject](name, attributes) {
    if (TemplateNamespace.hasOwnProperty(name)) {
      const node = TemplateNamespace[name](attributes);
      node[$setSetAttributes](attributes);
      return node;
    }
    return undefined;
  }
  static appearanceFilter(attrs) {
    return new AppearanceFilter(attrs);
  }
  static arc(attrs) {
    return new Arc(attrs);
  }
  static area(attrs) {
    return new Area(attrs);
  }
  static assist(attrs) {
    return new Assist(attrs);
  }
  static barcode(attrs) {
    return new Barcode(attrs);
  }
  static bind(attrs) {
    return new Bind(attrs);
  }
  static bindItems(attrs) {
    return new BindItems(attrs);
  }
  static bookend(attrs) {
    return new Bookend(attrs);
  }
  static boolean(attrs) {
    return new BooleanElement(attrs);
  }
  static border(attrs) {
    return new Border(attrs);
  }
  static break(attrs) {
    return new Break(attrs);
  }
  static breakAfter(attrs) {
    return new BreakAfter(attrs);
  }
  static breakBefore(attrs) {
    return new BreakBefore(attrs);
  }
  static button(attrs) {
    return new Button(attrs);
  }
  static calculate(attrs) {
    return new Calculate(attrs);
  }
  static caption(attrs) {
    return new Caption(attrs);
  }
  static certificate(attrs) {
    return new Certificate(attrs);
  }
  static certificates(attrs) {
    return new Certificates(attrs);
  }
  static checkButton(attrs) {
    return new CheckButton(attrs);
  }
  static choiceList(attrs) {
    return new ChoiceList(attrs);
  }
  static color(attrs) {
    return new Color(attrs);
  }
  static comb(attrs) {
    return new Comb(attrs);
  }
  static connect(attrs) {
    return new Connect(attrs);
  }
  static contentArea(attrs) {
    return new ContentArea(attrs);
  }
  static corner(attrs) {
    return new Corner(attrs);
  }
  static date(attrs) {
    return new DateElement(attrs);
  }
  static dateTime(attrs) {
    return new DateTime(attrs);
  }
  static dateTimeEdit(attrs) {
    return new DateTimeEdit(attrs);
  }
  static decimal(attrs) {
    return new Decimal(attrs);
  }
  static defaultUi(attrs) {
    return new DefaultUi(attrs);
  }
  static desc(attrs) {
    return new Desc(attrs);
  }
  static digestMethod(attrs) {
    return new DigestMethod(attrs);
  }
  static digestMethods(attrs) {
    return new DigestMethods(attrs);
  }
  static draw(attrs) {
    return new Draw(attrs);
  }
  static edge(attrs) {
    return new Edge(attrs);
  }
  static encoding(attrs) {
    return new Encoding(attrs);
  }
  static encodings(attrs) {
    return new Encodings(attrs);
  }
  static encrypt(attrs) {
    return new Encrypt(attrs);
  }
  static encryptData(attrs) {
    return new EncryptData(attrs);
  }
  static encryption(attrs) {
    return new Encryption(attrs);
  }
  static encryptionMethod(attrs) {
    return new EncryptionMethod(attrs);
  }
  static encryptionMethods(attrs) {
    return new EncryptionMethods(attrs);
  }
  static event(attrs) {
    return new Event(attrs);
  }
  static exData(attrs) {
    return new ExData(attrs);
  }
  static exObject(attrs) {
    return new ExObject(attrs);
  }
  static exclGroup(attrs) {
    return new ExclGroup(attrs);
  }
  static execute(attrs) {
    return new Execute(attrs);
  }
  static extras(attrs) {
    return new Extras(attrs);
  }
  static field(attrs) {
    return new Field(attrs);
  }
  static fill(attrs) {
    return new Fill(attrs);
  }
  static filter(attrs) {
    return new Filter(attrs);
  }
  static float(attrs) {
    return new Float(attrs);
  }
  static font(attrs) {
    return new template_Font(attrs);
  }
  static format(attrs) {
    return new Format(attrs);
  }
  static handler(attrs) {
    return new Handler(attrs);
  }
  static hyphenation(attrs) {
    return new Hyphenation(attrs);
  }
  static image(attrs) {
    return new Image(attrs);
  }
  static imageEdit(attrs) {
    return new ImageEdit(attrs);
  }
  static integer(attrs) {
    return new Integer(attrs);
  }
  static issuers(attrs) {
    return new Issuers(attrs);
  }
  static items(attrs) {
    return new Items(attrs);
  }
  static keep(attrs) {
    return new Keep(attrs);
  }
  static keyUsage(attrs) {
    return new KeyUsage(attrs);
  }
  static line(attrs) {
    return new Line(attrs);
  }
  static linear(attrs) {
    return new Linear(attrs);
  }
  static lockDocument(attrs) {
    return new LockDocument(attrs);
  }
  static manifest(attrs) {
    return new Manifest(attrs);
  }
  static margin(attrs) {
    return new Margin(attrs);
  }
  static mdp(attrs) {
    return new Mdp(attrs);
  }
  static medium(attrs) {
    return new Medium(attrs);
  }
  static message(attrs) {
    return new Message(attrs);
  }
  static numericEdit(attrs) {
    return new NumericEdit(attrs);
  }
  static occur(attrs) {
    return new Occur(attrs);
  }
  static oid(attrs) {
    return new Oid(attrs);
  }
  static oids(attrs) {
    return new Oids(attrs);
  }
  static overflow(attrs) {
    return new Overflow(attrs);
  }
  static pageArea(attrs) {
    return new PageArea(attrs);
  }
  static pageSet(attrs) {
    return new PageSet(attrs);
  }
  static para(attrs) {
    return new Para(attrs);
  }
  static passwordEdit(attrs) {
    return new PasswordEdit(attrs);
  }
  static pattern(attrs) {
    return new template_Pattern(attrs);
  }
  static picture(attrs) {
    return new Picture(attrs);
  }
  static proto(attrs) {
    return new Proto(attrs);
  }
  static radial(attrs) {
    return new Radial(attrs);
  }
  static reason(attrs) {
    return new Reason(attrs);
  }
  static reasons(attrs) {
    return new Reasons(attrs);
  }
  static rectangle(attrs) {
    return new Rectangle(attrs);
  }
  static ref(attrs) {
    return new RefElement(attrs);
  }
  static script(attrs) {
    return new Script(attrs);
  }
  static setProperty(attrs) {
    return new SetProperty(attrs);
  }
  static signData(attrs) {
    return new SignData(attrs);
  }
  static signature(attrs) {
    return new Signature(attrs);
  }
  static signing(attrs) {
    return new Signing(attrs);
  }
  static solid(attrs) {
    return new Solid(attrs);
  }
  static speak(attrs) {
    return new Speak(attrs);
  }
  static stipple(attrs) {
    return new Stipple(attrs);
  }
  static subform(attrs) {
    return new Subform(attrs);
  }
  static subformSet(attrs) {
    return new SubformSet(attrs);
  }
  static subjectDN(attrs) {
    return new SubjectDN(attrs);
  }
  static subjectDNs(attrs) {
    return new SubjectDNs(attrs);
  }
  static submit(attrs) {
    return new Submit(attrs);
  }
  static template(attrs) {
    return new Template(attrs);
  }
  static text(attrs) {
    return new Text(attrs);
  }
  static textEdit(attrs) {
    return new TextEdit(attrs);
  }
  static time(attrs) {
    return new Time(attrs);
  }
  static timeStamp(attrs) {
    return new TimeStamp(attrs);
  }
  static toolTip(attrs) {
    return new ToolTip(attrs);
  }
  static traversal(attrs) {
    return new Traversal(attrs);
  }
  static traverse(attrs) {
    return new Traverse(attrs);
  }
  static ui(attrs) {
    return new Ui(attrs);
  }
  static validate(attrs) {
    return new Validate(attrs);
  }
  static value(attrs) {
    return new Value(attrs);
  }
  static variables(attrs) {
    return new Variables(attrs);
  }
}

;// ./src/core/xfa/bind.js











const bind_NS_DATASETS = NamespaceIds.datasets.id;
function createText(content) {
  const node = new Text({});
  node[$content] = content;
  return node;
}
class Binder {
  constructor(root) {
    this.root = root;
    this.datasets = root.datasets;
    this.data = root.datasets?.data || new XmlObject(NamespaceIds.datasets.id, "data");
    this.emptyMerge = this.data[$getChildren]().length === 0;
    this.root.form = this.form = root.template[$clone]();
  }
  _isConsumeData() {
    return !this.emptyMerge && this._mergeMode;
  }
  _isMatchTemplate() {
    return !this._isConsumeData();
  }
  bind() {
    this._bindElement(this.form, this.data);
    return this.form;
  }
  getData() {
    return this.data;
  }
  _bindValue(formNode, data, picture) {
    formNode[$data] = data;
    if (formNode[$hasSettableValue]()) {
      if (data[$isDataValue]()) {
        const value = data[$getDataValue]();
        formNode[$setValue](createText(value));
      } else if (formNode instanceof Field && formNode.ui?.choiceList?.open === "multiSelect") {
        const value = data[$getChildren]().map(child => child[$content].trim()).join("\n");
        formNode[$setValue](createText(value));
      } else if (this._isConsumeData()) {
        warn(`XFA - Nodes haven't the same type.`);
      }
    } else if (!data[$isDataValue]() || this._isMatchTemplate()) {
      this._bindElement(formNode, data);
    } else {
      warn(`XFA - Nodes haven't the same type.`);
    }
  }
  _findDataByNameToConsume(name, isValue, dataNode, global) {
    if (!name) {
      return null;
    }
    let generator, match;
    for (let i = 0; i < 3; i++) {
      generator = dataNode[$getRealChildrenByNameIt](name, false, true);
      while (true) {
        match = generator.next().value;
        if (!match) {
          break;
        }
        if (isValue === match[$isDataValue]()) {
          return match;
        }
      }
      if (dataNode[$namespaceId] === NamespaceIds.datasets.id && dataNode[$nodeName] === "data") {
        break;
      }
      dataNode = dataNode[$getParent]();
    }
    if (!global) {
      return null;
    }
    generator = this.data[$getRealChildrenByNameIt](name, true, false);
    match = generator.next().value;
    if (match) {
      return match;
    }
    generator = this.data[$getAttributeIt](name, true);
    match = generator.next().value;
    if (match?.[$isDataValue]()) {
      return match;
    }
    return null;
  }
  _setProperties(formNode, dataNode) {
    if (!formNode.hasOwnProperty("setProperty")) {
      return;
    }
    for (const {
      ref,
      target,
      connection
    } of formNode.setProperty.children) {
      if (connection) {
        continue;
      }
      if (!ref) {
        continue;
      }
      const nodes = searchNode(this.root, dataNode, ref, false, false);
      if (!nodes) {
        warn(`XFA - Invalid reference: ${ref}.`);
        continue;
      }
      const [node] = nodes;
      if (!node[$isDescendent](this.data)) {
        warn(`XFA - Invalid node: must be a data node.`);
        continue;
      }
      const targetNodes = searchNode(this.root, formNode, target, false, false);
      if (!targetNodes) {
        warn(`XFA - Invalid target: ${target}.`);
        continue;
      }
      const [targetNode] = targetNodes;
      if (!targetNode[$isDescendent](formNode)) {
        warn(`XFA - Invalid target: must be a property or subproperty.`);
        continue;
      }
      const targetParent = targetNode[$getParent]();
      if (targetNode instanceof SetProperty || targetParent instanceof SetProperty) {
        warn(`XFA - Invalid target: cannot be a setProperty or one of its properties.`);
        continue;
      }
      if (targetNode instanceof BindItems || targetParent instanceof BindItems) {
        warn(`XFA - Invalid target: cannot be a bindItems or one of its properties.`);
        continue;
      }
      const content = node[$text]();
      const name = targetNode[$nodeName];
      if (targetNode instanceof XFAAttribute) {
        const attrs = Object.create(null);
        attrs[name] = content;
        const obj = Reflect.construct(Object.getPrototypeOf(targetParent).constructor, [attrs]);
        targetParent[name] = obj[name];
        continue;
      }
      if (!targetNode.hasOwnProperty($content)) {
        warn(`XFA - Invalid node to use in setProperty`);
        continue;
      }
      targetNode[$data] = node;
      targetNode[$content] = content;
      targetNode[$finalize]();
    }
  }
  _bindItems(formNode, dataNode) {
    if (!formNode.hasOwnProperty("items") || !formNode.hasOwnProperty("bindItems") || formNode.bindItems.isEmpty()) {
      return;
    }
    for (const item of formNode.items.children) {
      formNode[$removeChild](item);
    }
    formNode.items.clear();
    const labels = new Items({});
    const values = new Items({});
    formNode[$appendChild](labels);
    formNode.items.push(labels);
    formNode[$appendChild](values);
    formNode.items.push(values);
    for (const {
      ref,
      labelRef,
      valueRef,
      connection
    } of formNode.bindItems.children) {
      if (connection) {
        continue;
      }
      if (!ref) {
        continue;
      }
      const nodes = searchNode(this.root, dataNode, ref, false, false);
      if (!nodes) {
        warn(`XFA - Invalid reference: ${ref}.`);
        continue;
      }
      for (const node of nodes) {
        if (!node[$isDescendent](this.datasets)) {
          warn(`XFA - Invalid ref (${ref}): must be a datasets child.`);
          continue;
        }
        const labelNodes = searchNode(this.root, node, labelRef, true, false);
        if (!labelNodes) {
          warn(`XFA - Invalid label: ${labelRef}.`);
          continue;
        }
        const [labelNode] = labelNodes;
        if (!labelNode[$isDescendent](this.datasets)) {
          warn(`XFA - Invalid label: must be a datasets child.`);
          continue;
        }
        const valueNodes = searchNode(this.root, node, valueRef, true, false);
        if (!valueNodes) {
          warn(`XFA - Invalid value: ${valueRef}.`);
          continue;
        }
        const [valueNode] = valueNodes;
        if (!valueNode[$isDescendent](this.datasets)) {
          warn(`XFA - Invalid value: must be a datasets child.`);
          continue;
        }
        const label = createText(labelNode[$text]());
        const value = createText(valueNode[$text]());
        labels[$appendChild](label);
        labels.text.push(label);
        values[$appendChild](value);
        values.text.push(value);
      }
    }
  }
  _bindOccurrences(formNode, matches, picture) {
    let baseClone;
    if (matches.length > 1) {
      baseClone = formNode[$clone]();
      baseClone[$removeChild](baseClone.occur);
      baseClone.occur = null;
    }
    this._bindValue(formNode, matches[0], picture);
    this._setProperties(formNode, matches[0]);
    this._bindItems(formNode, matches[0]);
    if (matches.length === 1) {
      return;
    }
    const parent = formNode[$getParent]();
    const name = formNode[$nodeName];
    const pos = parent[$indexOf](formNode);
    for (let i = 1, ii = matches.length; i < ii; i++) {
      const match = matches[i];
      const clone = baseClone[$clone]();
      parent[name].push(clone);
      parent[$insertAt](pos + i, clone);
      this._bindValue(clone, match, picture);
      this._setProperties(clone, match);
      this._bindItems(clone, match);
    }
  }
  _createOccurrences(formNode) {
    if (!this.emptyMerge) {
      return;
    }
    const {
      occur
    } = formNode;
    if (!occur || occur.initial <= 1) {
      return;
    }
    const parent = formNode[$getParent]();
    const name = formNode[$nodeName];
    if (!(parent[name] instanceof XFAObjectArray)) {
      return;
    }
    let currentNumber;
    if (formNode.name) {
      currentNumber = parent[name].children.filter(e => e.name === formNode.name).length;
    } else {
      currentNumber = parent[name].children.length;
    }
    const pos = parent[$indexOf](formNode) + 1;
    const ii = occur.initial - currentNumber;
    if (ii) {
      const nodeClone = formNode[$clone]();
      nodeClone[$removeChild](nodeClone.occur);
      nodeClone.occur = null;
      parent[name].push(nodeClone);
      parent[$insertAt](pos, nodeClone);
      for (let i = 1; i < ii; i++) {
        const clone = nodeClone[$clone]();
        parent[name].push(clone);
        parent[$insertAt](pos + i, clone);
      }
    }
  }
  _getOccurInfo(formNode) {
    const {
      name,
      occur
    } = formNode;
    if (!occur || !name) {
      return [1, 1];
    }
    const max = occur.max === -1 ? Infinity : occur.max;
    return [occur.min, max];
  }
  _setAndBind(formNode, dataNode) {
    this._setProperties(formNode, dataNode);
    this._bindItems(formNode, dataNode);
    this._bindElement(formNode, dataNode);
  }
  _bindElement(formNode, dataNode) {
    const uselessNodes = [];
    this._createOccurrences(formNode);
    for (const child of formNode[$getChildren]()) {
      if (child[$data]) {
        continue;
      }
      if (this._mergeMode === undefined && child[$nodeName] === "subform") {
        this._mergeMode = child.mergeMode === "consumeData";
        const dataChildren = dataNode[$getChildren]();
        if (dataChildren.length > 0) {
          this._bindOccurrences(child, [dataChildren[0]], null);
        } else if (this.emptyMerge) {
          const nsId = dataNode[$namespaceId] === bind_NS_DATASETS ? -1 : dataNode[$namespaceId];
          const dataChild = child[$data] = new XmlObject(nsId, child.name || "root");
          dataNode[$appendChild](dataChild);
          this._bindElement(child, dataChild);
        }
        continue;
      }
      if (!child[$isBindable]()) {
        continue;
      }
      let global = false;
      let picture = null;
      let ref = null;
      let match = null;
      if (child.bind) {
        switch (child.bind.match) {
          case "none":
            this._setAndBind(child, dataNode);
            continue;
          case "global":
            global = true;
            break;
          case "dataRef":
            if (!child.bind.ref) {
              warn(`XFA - ref is empty in node ${child[$nodeName]}.`);
              this._setAndBind(child, dataNode);
              continue;
            }
            ref = child.bind.ref;
            break;
          default:
            break;
        }
        if (child.bind.picture) {
          picture = child.bind.picture[$content];
        }
      }
      const [min, max] = this._getOccurInfo(child);
      if (ref) {
        match = searchNode(this.root, dataNode, ref, true, false);
        if (match === null) {
          match = createDataNode(this.data, dataNode, ref);
          if (!match) {
            continue;
          }
          if (this._isConsumeData()) {
            match[$consumed] = true;
          }
          this._setAndBind(child, match);
          continue;
        } else {
          if (this._isConsumeData()) {
            match = match.filter(node => !node[$consumed]);
          }
          if (match.length > max) {
            match = match.slice(0, max);
          } else if (match.length === 0) {
            match = null;
          }
          if (match && this._isConsumeData()) {
            match.forEach(node => {
              node[$consumed] = true;
            });
          }
        }
      } else {
        if (!child.name) {
          this._setAndBind(child, dataNode);
          continue;
        }
        if (this._isConsumeData()) {
          const matches = [];
          while (matches.length < max) {
            const found = this._findDataByNameToConsume(child.name, child[$hasSettableValue](), dataNode, global);
            if (!found) {
              break;
            }
            found[$consumed] = true;
            matches.push(found);
          }
          match = matches.length > 0 ? matches : null;
        } else {
          match = dataNode[$getRealChildrenByNameIt](child.name, false, this.emptyMerge).next().value;
          if (!match) {
            if (min === 0) {
              uselessNodes.push(child);
              continue;
            }
            const nsId = dataNode[$namespaceId] === bind_NS_DATASETS ? -1 : dataNode[$namespaceId];
            match = child[$data] = new XmlObject(nsId, child.name);
            if (this.emptyMerge) {
              match[$consumed] = true;
            }
            dataNode[$appendChild](match);
            this._setAndBind(child, match);
            continue;
          }
          if (this.emptyMerge) {
            match[$consumed] = true;
          }
          match = [match];
        }
      }
      if (match) {
        this._bindOccurrences(child, match, picture);
      } else if (min > 0) {
        this._setAndBind(child, dataNode);
      } else {
        uselessNodes.push(child);
      }
    }
    uselessNodes.forEach(node => node[$getParent]()[$removeChild](node));
  }
}

;// ./src/core/xfa/data.js


class DataHandler {
  constructor(root, data) {
    this.data = data;
    this.dataset = root.datasets || null;
  }
  serialize(storage) {
    const stack = [[-1, this.data[$getChildren]()]];
    while (stack.length > 0) {
      const last = stack.at(-1);
      const [i, children] = last;
      if (i + 1 === children.length) {
        stack.pop();
        continue;
      }
      const child = children[++last[0]];
      const storageEntry = storage.get(child[$uid]);
      if (storageEntry) {
        child[$setValue](storageEntry);
      } else {
        const attributes = child[$getAttributes]();
        for (const value of attributes.values()) {
          const entry = storage.get(value[$uid]);
          if (entry) {
            value[$setValue](entry);
            break;
          }
        }
      }
      const nodes = child[$getChildren]();
      if (nodes.length > 0) {
        stack.push([-1, nodes]);
      }
    }
    const buf = [`<xfa:datasets xmlns:xfa="http://www.xfa.org/schema/xfa-data/1.0/">`];
    if (this.dataset) {
      for (const child of this.dataset[$getChildren]()) {
        if (child[$nodeName] !== "data") {
          child[$toString](buf);
        }
      }
    }
    this.data[$toString](buf);
    buf.push("</xfa:datasets>");
    return buf.join("");
  }
}

;// ./src/core/xfa/config.js











const CONFIG_NS_ID = NamespaceIds.config.id;
class Acrobat extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "acrobat", true);
    this.acrobat7 = null;
    this.autoSave = null;
    this.common = null;
    this.validate = null;
    this.validateApprovalSignatures = null;
    this.submitUrl = new XFAObjectArray();
  }
}
class Acrobat7 extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "acrobat7", true);
    this.dynamicRender = null;
  }
}
class ADBE_JSConsole extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "ADBE_JSConsole", ["delegate", "Enable", "Disable"]);
  }
}
class ADBE_JSDebugger extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "ADBE_JSDebugger", ["delegate", "Enable", "Disable"]);
  }
}
class AddSilentPrint extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "addSilentPrint");
  }
}
class AddViewerPreferences extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "addViewerPreferences");
  }
}
class AdjustData extends Option10 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "adjustData");
  }
}
class AdobeExtensionLevel extends IntegerObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "adobeExtensionLevel", 0, n => n >= 1 && n <= 8);
  }
}
class Agent extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "agent", true);
    this.name = attributes.name ? attributes.name.trim() : "";
    this.common = new XFAObjectArray();
  }
}
class AlwaysEmbed extends ContentObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "alwaysEmbed");
  }
}
class Amd extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "amd");
  }
}
class config_Area extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "area");
    this.level = getInteger({
      data: attributes.level,
      defaultValue: 0,
      validate: n => n >= 1 && n <= 3
    });
    this.name = getStringOption(attributes.name, ["", "barcode", "coreinit", "deviceDriver", "font", "general", "layout", "merge", "script", "signature", "sourceSet", "templateCache"]);
  }
}
class Attributes extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "attributes", ["preserve", "delegate", "ignore"]);
  }
}
class AutoSave extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "autoSave", ["disabled", "enabled"]);
  }
}
class Base extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "base");
  }
}
class BatchOutput extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "batchOutput");
    this.format = getStringOption(attributes.format, ["none", "concat", "zip", "zipCompress"]);
  }
}
class BehaviorOverride extends ContentObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "behaviorOverride");
  }
  [$finalize]() {
    this[$content] = new Map(this[$content].trim().split(/\s+/).filter(x => x.includes(":")).map(x => x.split(":", 2)));
  }
}
class Cache extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "cache", true);
    this.templateCache = null;
  }
}
class Change extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "change");
  }
}
class Common extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "common", true);
    this.data = null;
    this.locale = null;
    this.localeSet = null;
    this.messaging = null;
    this.suppressBanner = null;
    this.template = null;
    this.validationMessaging = null;
    this.versionControl = null;
    this.log = new XFAObjectArray();
  }
}
class Compress extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "compress");
    this.scope = getStringOption(attributes.scope, ["imageOnly", "document"]);
  }
}
class CompressLogicalStructure extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "compressLogicalStructure");
  }
}
class CompressObjectStream extends Option10 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "compressObjectStream");
  }
}
class Compression extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "compression", true);
    this.compressLogicalStructure = null;
    this.compressObjectStream = null;
    this.level = null;
    this.type = null;
  }
}
class Config extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "config", true);
    this.acrobat = null;
    this.present = null;
    this.trace = null;
    this.agent = new XFAObjectArray();
  }
}
class Conformance extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "conformance", ["A", "B"]);
  }
}
class ContentCopy extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "contentCopy");
  }
}
class Copies extends IntegerObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "copies", 1, n => n >= 1);
  }
}
class Creator extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "creator");
  }
}
class CurrentPage extends IntegerObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "currentPage", 0, n => n >= 0);
  }
}
class Data extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "data", true);
    this.adjustData = null;
    this.attributes = null;
    this.incrementalLoad = null;
    this.outputXSL = null;
    this.range = null;
    this.record = null;
    this.startNode = null;
    this.uri = null;
    this.window = null;
    this.xsl = null;
    this.excludeNS = new XFAObjectArray();
    this.transform = new XFAObjectArray();
  }
}
class Debug extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "debug", true);
    this.uri = null;
  }
}
class DefaultTypeface extends ContentObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "defaultTypeface");
    this.writingScript = getStringOption(attributes.writingScript, ["*", "Arabic", "Cyrillic", "EastEuropeanRoman", "Greek", "Hebrew", "Japanese", "Korean", "Roman", "SimplifiedChinese", "Thai", "TraditionalChinese", "Vietnamese"]);
  }
}
class Destination extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "destination", ["pdf", "pcl", "ps", "webClient", "zpl"]);
  }
}
class DocumentAssembly extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "documentAssembly");
  }
}
class Driver extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "driver", true);
    this.name = attributes.name ? attributes.name.trim() : "";
    this.fontInfo = null;
    this.xdc = null;
  }
}
class DuplexOption extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "duplexOption", ["simplex", "duplexFlipLongEdge", "duplexFlipShortEdge"]);
  }
}
class DynamicRender extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "dynamicRender", ["forbidden", "required"]);
  }
}
class Embed extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "embed");
  }
}
class config_Encrypt extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "encrypt");
  }
}
class config_Encryption extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "encryption", true);
    this.encrypt = null;
    this.encryptionLevel = null;
    this.permissions = null;
  }
}
class EncryptionLevel extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "encryptionLevel", ["40bit", "128bit"]);
  }
}
class Enforce extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "enforce");
  }
}
class Equate extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "equate");
    this.force = getInteger({
      data: attributes.force,
      defaultValue: 1,
      validate: n => n === 0
    });
    this.from = attributes.from || "";
    this.to = attributes.to || "";
  }
}
class EquateRange extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "equateRange");
    this.from = attributes.from || "";
    this.to = attributes.to || "";
    this._unicodeRange = attributes.unicodeRange || "";
  }
  get unicodeRange() {
    const ranges = [];
    const unicodeRegex = /U\+([0-9a-fA-F]+)/;
    const unicodeRange = this._unicodeRange;
    for (let range of unicodeRange.split(",").map(x => x.trim()).filter(x => !!x)) {
      range = range.split("-", 2).map(x => {
        const found = x.match(unicodeRegex);
        if (!found) {
          return 0;
        }
        return parseInt(found[1], 16);
      });
      if (range.length === 1) {
        range.push(range[0]);
      }
      ranges.push(range);
    }
    return shadow(this, "unicodeRange", ranges);
  }
}
class Exclude extends ContentObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "exclude");
  }
  [$finalize]() {
    this[$content] = this[$content].trim().split(/\s+/).filter(x => x && ["calculate", "close", "enter", "exit", "initialize", "ready", "validate"].includes(x));
  }
}
class ExcludeNS extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "excludeNS");
  }
}
class FlipLabel extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "flipLabel", ["usePrinterSetting", "on", "off"]);
  }
}
class config_FontInfo extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "fontInfo", true);
    this.embed = null;
    this.map = null;
    this.subsetBelow = null;
    this.alwaysEmbed = new XFAObjectArray();
    this.defaultTypeface = new XFAObjectArray();
    this.neverEmbed = new XFAObjectArray();
  }
}
class FormFieldFilling extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "formFieldFilling");
  }
}
class GroupParent extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "groupParent");
  }
}
class IfEmpty extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "ifEmpty", ["dataValue", "dataGroup", "ignore", "remove"]);
  }
}
class IncludeXDPContent extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "includeXDPContent");
  }
}
class IncrementalLoad extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "incrementalLoad", ["none", "forwardOnly"]);
  }
}
class IncrementalMerge extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "incrementalMerge");
  }
}
class Interactive extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "interactive");
  }
}
class Jog extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "jog", ["usePrinterSetting", "none", "pageSet"]);
  }
}
class LabelPrinter extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "labelPrinter", true);
    this.name = getStringOption(attributes.name, ["zpl", "dpl", "ipl", "tcpl"]);
    this.batchOutput = null;
    this.flipLabel = null;
    this.fontInfo = null;
    this.xdc = null;
  }
}
class Layout extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "layout", ["paginate", "panel"]);
  }
}
class Level extends IntegerObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "level", 0, n => n > 0);
  }
}
class Linearized extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "linearized");
  }
}
class Locale extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "locale");
  }
}
class LocaleSet extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "localeSet");
  }
}
class Log extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "log", true);
    this.mode = null;
    this.threshold = null;
    this.to = null;
    this.uri = null;
  }
}
class MapElement extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "map", true);
    this.equate = new XFAObjectArray();
    this.equateRange = new XFAObjectArray();
  }
}
class MediumInfo extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "mediumInfo", true);
    this.map = null;
  }
}
class config_Message extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "message", true);
    this.msgId = null;
    this.severity = null;
  }
}
class Messaging extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "messaging", true);
    this.message = new XFAObjectArray();
  }
}
class Mode extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "mode", ["append", "overwrite"]);
  }
}
class ModifyAnnots extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "modifyAnnots");
  }
}
class MsgId extends IntegerObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "msgId", 1, n => n >= 1);
  }
}
class NameAttr extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "nameAttr");
  }
}
class NeverEmbed extends ContentObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "neverEmbed");
  }
}
class NumberOfCopies extends IntegerObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "numberOfCopies", null, n => n >= 2 && n <= 5);
  }
}
class OpenAction extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "openAction", true);
    this.destination = null;
  }
}
class Output extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "output", true);
    this.to = null;
    this.type = null;
    this.uri = null;
  }
}
class OutputBin extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "outputBin");
  }
}
class OutputXSL extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "outputXSL", true);
    this.uri = null;
  }
}
class Overprint extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "overprint", ["none", "both", "draw", "field"]);
  }
}
class Packets extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "packets");
  }
  [$finalize]() {
    if (this[$content] === "*") {
      return;
    }
    this[$content] = this[$content].trim().split(/\s+/).filter(x => ["config", "datasets", "template", "xfdf", "xslt"].includes(x));
  }
}
class PageOffset extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "pageOffset");
    this.x = getInteger({
      data: attributes.x,
      defaultValue: "useXDCSetting",
      validate: n => true
    });
    this.y = getInteger({
      data: attributes.y,
      defaultValue: "useXDCSetting",
      validate: n => true
    });
  }
}
class PageRange extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "pageRange");
  }
  [$finalize]() {
    const numbers = this[$content].trim().split(/\s+/).map(x => parseInt(x, 10));
    const ranges = [];
    for (let i = 0, ii = numbers.length; i < ii; i += 2) {
      ranges.push(numbers.slice(i, i + 2));
    }
    this[$content] = ranges;
  }
}
class Pagination extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "pagination", ["simplex", "duplexShortEdge", "duplexLongEdge"]);
  }
}
class PaginationOverride extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "paginationOverride", ["none", "forceDuplex", "forceDuplexLongEdge", "forceDuplexShortEdge", "forceSimplex"]);
  }
}
class Part extends IntegerObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "part", 1, n => false);
  }
}
class Pcl extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "pcl", true);
    this.name = attributes.name || "";
    this.batchOutput = null;
    this.fontInfo = null;
    this.jog = null;
    this.mediumInfo = null;
    this.outputBin = null;
    this.pageOffset = null;
    this.staple = null;
    this.xdc = null;
  }
}
class Pdf extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "pdf", true);
    this.name = attributes.name || "";
    this.adobeExtensionLevel = null;
    this.batchOutput = null;
    this.compression = null;
    this.creator = null;
    this.encryption = null;
    this.fontInfo = null;
    this.interactive = null;
    this.linearized = null;
    this.openAction = null;
    this.pdfa = null;
    this.producer = null;
    this.renderPolicy = null;
    this.scriptModel = null;
    this.silentPrint = null;
    this.submitFormat = null;
    this.tagged = null;
    this.version = null;
    this.viewerPreferences = null;
    this.xdc = null;
  }
}
class Pdfa extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "pdfa", true);
    this.amd = null;
    this.conformance = null;
    this.includeXDPContent = null;
    this.part = null;
  }
}
class Permissions extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "permissions", true);
    this.accessibleContent = null;
    this.change = null;
    this.contentCopy = null;
    this.documentAssembly = null;
    this.formFieldFilling = null;
    this.modifyAnnots = null;
    this.plaintextMetadata = null;
    this.print = null;
    this.printHighQuality = null;
  }
}
class PickTrayByPDFSize extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "pickTrayByPDFSize");
  }
}
class config_Picture extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "picture");
  }
}
class PlaintextMetadata extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "plaintextMetadata");
  }
}
class Presence extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "presence", ["preserve", "dissolve", "dissolveStructure", "ignore", "remove"]);
  }
}
class Present extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "present", true);
    this.behaviorOverride = null;
    this.cache = null;
    this.common = null;
    this.copies = null;
    this.destination = null;
    this.incrementalMerge = null;
    this.layout = null;
    this.output = null;
    this.overprint = null;
    this.pagination = null;
    this.paginationOverride = null;
    this.script = null;
    this.validate = null;
    this.xdp = null;
    this.driver = new XFAObjectArray();
    this.labelPrinter = new XFAObjectArray();
    this.pcl = new XFAObjectArray();
    this.pdf = new XFAObjectArray();
    this.ps = new XFAObjectArray();
    this.submitUrl = new XFAObjectArray();
    this.webClient = new XFAObjectArray();
    this.zpl = new XFAObjectArray();
  }
}
class Print extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "print");
  }
}
class PrintHighQuality extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "printHighQuality");
  }
}
class PrintScaling extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "printScaling", ["appdefault", "noScaling"]);
  }
}
class PrinterName extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "printerName");
  }
}
class Producer extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "producer");
  }
}
class Ps extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "ps", true);
    this.name = attributes.name || "";
    this.batchOutput = null;
    this.fontInfo = null;
    this.jog = null;
    this.mediumInfo = null;
    this.outputBin = null;
    this.staple = null;
    this.xdc = null;
  }
}
class Range extends ContentObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "range");
  }
  [$finalize]() {
    this[$content] = this[$content].split(",", 2).map(range => range.split("-").map(x => parseInt(x.trim(), 10))).filter(range => range.every(x => !isNaN(x))).map(range => {
      if (range.length === 1) {
        range.push(range[0]);
      }
      return range;
    });
  }
}
class Record extends ContentObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "record");
  }
  [$finalize]() {
    this[$content] = this[$content].trim();
    const n = parseInt(this[$content], 10);
    if (!isNaN(n) && n >= 0) {
      this[$content] = n;
    }
  }
}
class Relevant extends ContentObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "relevant");
  }
  [$finalize]() {
    this[$content] = this[$content].trim().split(/\s+/);
  }
}
class Rename extends ContentObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "rename");
  }
  [$finalize]() {
    this[$content] = this[$content].trim();
    if (this[$content].toLowerCase().startsWith("xml") || new RegExp("[\\p{L}_][\\p{L}\\d._\\p{M}-]*", "u").test(this[$content])) {
      warn("XFA - Rename: invalid XFA name");
    }
  }
}
class RenderPolicy extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "renderPolicy", ["server", "client"]);
  }
}
class RunScripts extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "runScripts", ["both", "client", "none", "server"]);
  }
}
class config_Script extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "script", true);
    this.currentPage = null;
    this.exclude = null;
    this.runScripts = null;
  }
}
class ScriptModel extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "scriptModel", ["XFA", "none"]);
  }
}
class Severity extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "severity", ["ignore", "error", "information", "trace", "warning"]);
  }
}
class SilentPrint extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "silentPrint", true);
    this.addSilentPrint = null;
    this.printerName = null;
  }
}
class Staple extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "staple");
    this.mode = getStringOption(attributes.mode, ["usePrinterSetting", "on", "off"]);
  }
}
class StartNode extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "startNode");
  }
}
class StartPage extends IntegerObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "startPage", 0, n => true);
  }
}
class SubmitFormat extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "submitFormat", ["html", "delegate", "fdf", "xml", "pdf"]);
  }
}
class SubmitUrl extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "submitUrl");
  }
}
class SubsetBelow extends IntegerObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "subsetBelow", 100, n => n >= 0 && n <= 100);
  }
}
class SuppressBanner extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "suppressBanner");
  }
}
class Tagged extends Option01 {
  constructor(attributes) {
    super(CONFIG_NS_ID, "tagged");
  }
}
class config_Template extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "template", true);
    this.base = null;
    this.relevant = null;
    this.startPage = null;
    this.uri = null;
    this.xsl = null;
  }
}
class Threshold extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "threshold", ["trace", "error", "information", "warning"]);
  }
}
class To extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "to", ["null", "memory", "stderr", "stdout", "system", "uri"]);
  }
}
class TemplateCache extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "templateCache");
    this.maxEntries = getInteger({
      data: attributes.maxEntries,
      defaultValue: 5,
      validate: n => n >= 0
    });
  }
}
class Trace extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "trace", true);
    this.area = new XFAObjectArray();
  }
}
class Transform extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "transform", true);
    this.groupParent = null;
    this.ifEmpty = null;
    this.nameAttr = null;
    this.picture = null;
    this.presence = null;
    this.rename = null;
    this.whitespace = null;
  }
}
class Type extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "type", ["none", "ascii85", "asciiHex", "ccittfax", "flate", "lzw", "runLength", "native", "xdp", "mergedXDP"]);
  }
}
class Uri extends StringObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "uri");
  }
}
class config_Validate extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "validate", ["preSubmit", "prePrint", "preExecute", "preSave"]);
  }
}
class ValidateApprovalSignatures extends ContentObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "validateApprovalSignatures");
  }
  [$finalize]() {
    this[$content] = this[$content].trim().split(/\s+/).filter(x => ["docReady", "postSign"].includes(x));
  }
}
class ValidationMessaging extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "validationMessaging", ["allMessagesIndividually", "allMessagesTogether", "firstMessageOnly", "noMessages"]);
  }
}
class Version extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "version", ["1.7", "1.6", "1.5", "1.4", "1.3", "1.2"]);
  }
}
class VersionControl extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "VersionControl");
    this.outputBelow = getStringOption(attributes.outputBelow, ["warn", "error", "update"]);
    this.sourceAbove = getStringOption(attributes.sourceAbove, ["warn", "error"]);
    this.sourceBelow = getStringOption(attributes.sourceBelow, ["update", "maintain"]);
  }
}
class ViewerPreferences extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "viewerPreferences", true);
    this.ADBE_JSConsole = null;
    this.ADBE_JSDebugger = null;
    this.addViewerPreferences = null;
    this.duplexOption = null;
    this.enforce = null;
    this.numberOfCopies = null;
    this.pageRange = null;
    this.pickTrayByPDFSize = null;
    this.printScaling = null;
  }
}
class WebClient extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "webClient", true);
    this.name = attributes.name ? attributes.name.trim() : "";
    this.fontInfo = null;
    this.xdc = null;
  }
}
class Whitespace extends OptionObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "whitespace", ["preserve", "ltrim", "normalize", "rtrim", "trim"]);
  }
}
class Window extends ContentObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "window");
  }
  [$finalize]() {
    const pair = this[$content].split(",", 2).map(x => parseInt(x.trim(), 10));
    if (pair.some(x => isNaN(x))) {
      this[$content] = [0, 0];
      return;
    }
    if (pair.length === 1) {
      pair.push(pair[0]);
    }
    this[$content] = pair;
  }
}
class Xdc extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "xdc", true);
    this.uri = new XFAObjectArray();
    this.xsl = new XFAObjectArray();
  }
}
class Xdp extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "xdp", true);
    this.packets = null;
  }
}
class Xsl extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "xsl", true);
    this.debug = null;
    this.uri = null;
  }
}
class Zpl extends XFAObject {
  constructor(attributes) {
    super(CONFIG_NS_ID, "zpl", true);
    this.name = attributes.name ? attributes.name.trim() : "";
    this.batchOutput = null;
    this.flipLabel = null;
    this.fontInfo = null;
    this.xdc = null;
  }
}
class ConfigNamespace {
  static [$buildXFAObject](name, attributes) {
    if (ConfigNamespace.hasOwnProperty(name)) {
      return ConfigNamespace[name](attributes);
    }
    return undefined;
  }
  static acrobat(attrs) {
    return new Acrobat(attrs);
  }
  static acrobat7(attrs) {
    return new Acrobat7(attrs);
  }
  static ADBE_JSConsole(attrs) {
    return new ADBE_JSConsole(attrs);
  }
  static ADBE_JSDebugger(attrs) {
    return new ADBE_JSDebugger(attrs);
  }
  static addSilentPrint(attrs) {
    return new AddSilentPrint(attrs);
  }
  static addViewerPreferences(attrs) {
    return new AddViewerPreferences(attrs);
  }
  static adjustData(attrs) {
    return new AdjustData(attrs);
  }
  static adobeExtensionLevel(attrs) {
    return new AdobeExtensionLevel(attrs);
  }
  static agent(attrs) {
    return new Agent(attrs);
  }
  static alwaysEmbed(attrs) {
    return new AlwaysEmbed(attrs);
  }
  static amd(attrs) {
    return new Amd(attrs);
  }
  static area(attrs) {
    return new config_Area(attrs);
  }
  static attributes(attrs) {
    return new Attributes(attrs);
  }
  static autoSave(attrs) {
    return new AutoSave(attrs);
  }
  static base(attrs) {
    return new Base(attrs);
  }
  static batchOutput(attrs) {
    return new BatchOutput(attrs);
  }
  static behaviorOverride(attrs) {
    return new BehaviorOverride(attrs);
  }
  static cache(attrs) {
    return new Cache(attrs);
  }
  static change(attrs) {
    return new Change(attrs);
  }
  static common(attrs) {
    return new Common(attrs);
  }
  static compress(attrs) {
    return new Compress(attrs);
  }
  static compressLogicalStructure(attrs) {
    return new CompressLogicalStructure(attrs);
  }
  static compressObjectStream(attrs) {
    return new CompressObjectStream(attrs);
  }
  static compression(attrs) {
    return new Compression(attrs);
  }
  static config(attrs) {
    return new Config(attrs);
  }
  static conformance(attrs) {
    return new Conformance(attrs);
  }
  static contentCopy(attrs) {
    return new ContentCopy(attrs);
  }
  static copies(attrs) {
    return new Copies(attrs);
  }
  static creator(attrs) {
    return new Creator(attrs);
  }
  static currentPage(attrs) {
    return new CurrentPage(attrs);
  }
  static data(attrs) {
    return new Data(attrs);
  }
  static debug(attrs) {
    return new Debug(attrs);
  }
  static defaultTypeface(attrs) {
    return new DefaultTypeface(attrs);
  }
  static destination(attrs) {
    return new Destination(attrs);
  }
  static documentAssembly(attrs) {
    return new DocumentAssembly(attrs);
  }
  static driver(attrs) {
    return new Driver(attrs);
  }
  static duplexOption(attrs) {
    return new DuplexOption(attrs);
  }
  static dynamicRender(attrs) {
    return new DynamicRender(attrs);
  }
  static embed(attrs) {
    return new Embed(attrs);
  }
  static encrypt(attrs) {
    return new config_Encrypt(attrs);
  }
  static encryption(attrs) {
    return new config_Encryption(attrs);
  }
  static encryptionLevel(attrs) {
    return new EncryptionLevel(attrs);
  }
  static enforce(attrs) {
    return new Enforce(attrs);
  }
  static equate(attrs) {
    return new Equate(attrs);
  }
  static equateRange(attrs) {
    return new EquateRange(attrs);
  }
  static exclude(attrs) {
    return new Exclude(attrs);
  }
  static excludeNS(attrs) {
    return new ExcludeNS(attrs);
  }
  static flipLabel(attrs) {
    return new FlipLabel(attrs);
  }
  static fontInfo(attrs) {
    return new config_FontInfo(attrs);
  }
  static formFieldFilling(attrs) {
    return new FormFieldFilling(attrs);
  }
  static groupParent(attrs) {
    return new GroupParent(attrs);
  }
  static ifEmpty(attrs) {
    return new IfEmpty(attrs);
  }
  static includeXDPContent(attrs) {
    return new IncludeXDPContent(attrs);
  }
  static incrementalLoad(attrs) {
    return new IncrementalLoad(attrs);
  }
  static incrementalMerge(attrs) {
    return new IncrementalMerge(attrs);
  }
  static interactive(attrs) {
    return new Interactive(attrs);
  }
  static jog(attrs) {
    return new Jog(attrs);
  }
  static labelPrinter(attrs) {
    return new LabelPrinter(attrs);
  }
  static layout(attrs) {
    return new Layout(attrs);
  }
  static level(attrs) {
    return new Level(attrs);
  }
  static linearized(attrs) {
    return new Linearized(attrs);
  }
  static locale(attrs) {
    return new Locale(attrs);
  }
  static localeSet(attrs) {
    return new LocaleSet(attrs);
  }
  static log(attrs) {
    return new Log(attrs);
  }
  static map(attrs) {
    return new MapElement(attrs);
  }
  static mediumInfo(attrs) {
    return new MediumInfo(attrs);
  }
  static message(attrs) {
    return new config_Message(attrs);
  }
  static messaging(attrs) {
    return new Messaging(attrs);
  }
  static mode(attrs) {
    return new Mode(attrs);
  }
  static modifyAnnots(attrs) {
    return new ModifyAnnots(attrs);
  }
  static msgId(attrs) {
    return new MsgId(attrs);
  }
  static nameAttr(attrs) {
    return new NameAttr(attrs);
  }
  static neverEmbed(attrs) {
    return new NeverEmbed(attrs);
  }
  static numberOfCopies(attrs) {
    return new NumberOfCopies(attrs);
  }
  static openAction(attrs) {
    return new OpenAction(attrs);
  }
  static output(attrs) {
    return new Output(attrs);
  }
  static outputBin(attrs) {
    return new OutputBin(attrs);
  }
  static outputXSL(attrs) {
    return new OutputXSL(attrs);
  }
  static overprint(attrs) {
    return new Overprint(attrs);
  }
  static packets(attrs) {
    return new Packets(attrs);
  }
  static pageOffset(attrs) {
    return new PageOffset(attrs);
  }
  static pageRange(attrs) {
    return new PageRange(attrs);
  }
  static pagination(attrs) {
    return new Pagination(attrs);
  }
  static paginationOverride(attrs) {
    return new PaginationOverride(attrs);
  }
  static part(attrs) {
    return new Part(attrs);
  }
  static pcl(attrs) {
    return new Pcl(attrs);
  }
  static pdf(attrs) {
    return new Pdf(attrs);
  }
  static pdfa(attrs) {
    return new Pdfa(attrs);
  }
  static permissions(attrs) {
    return new Permissions(attrs);
  }
  static pickTrayByPDFSize(attrs) {
    return new PickTrayByPDFSize(attrs);
  }
  static picture(attrs) {
    return new config_Picture(attrs);
  }
  static plaintextMetadata(attrs) {
    return new PlaintextMetadata(attrs);
  }
  static presence(attrs) {
    return new Presence(attrs);
  }
  static present(attrs) {
    return new Present(attrs);
  }
  static print(attrs) {
    return new Print(attrs);
  }
  static printHighQuality(attrs) {
    return new PrintHighQuality(attrs);
  }
  static printScaling(attrs) {
    return new PrintScaling(attrs);
  }
  static printerName(attrs) {
    return new PrinterName(attrs);
  }
  static producer(attrs) {
    return new Producer(attrs);
  }
  static ps(attrs) {
    return new Ps(attrs);
  }
  static range(attrs) {
    return new Range(attrs);
  }
  static record(attrs) {
    return new Record(attrs);
  }
  static relevant(attrs) {
    return new Relevant(attrs);
  }
  static rename(attrs) {
    return new Rename(attrs);
  }
  static renderPolicy(attrs) {
    return new RenderPolicy(attrs);
  }
  static runScripts(attrs) {
    return new RunScripts(attrs);
  }
  static script(attrs) {
    return new config_Script(attrs);
  }
  static scriptModel(attrs) {
    return new ScriptModel(attrs);
  }
  static severity(attrs) {
    return new Severity(attrs);
  }
  static silentPrint(attrs) {
    return new SilentPrint(attrs);
  }
  static staple(attrs) {
    return new Staple(attrs);
  }
  static startNode(attrs) {
    return new StartNode(attrs);
  }
  static startPage(attrs) {
    return new StartPage(attrs);
  }
  static submitFormat(attrs) {
    return new SubmitFormat(attrs);
  }
  static submitUrl(attrs) {
    return new SubmitUrl(attrs);
  }
  static subsetBelow(attrs) {
    return new SubsetBelow(attrs);
  }
  static suppressBanner(attrs) {
    return new SuppressBanner(attrs);
  }
  static tagged(attrs) {
    return new Tagged(attrs);
  }
  static template(attrs) {
    return new config_Template(attrs);
  }
  static templateCache(attrs) {
    return new TemplateCache(attrs);
  }
  static threshold(attrs) {
    return new Threshold(attrs);
  }
  static to(attrs) {
    return new To(attrs);
  }
  static trace(attrs) {
    return new Trace(attrs);
  }
  static transform(attrs) {
    return new Transform(attrs);
  }
  static type(attrs) {
    return new Type(attrs);
  }
  static uri(attrs) {
    return new Uri(attrs);
  }
  static validate(attrs) {
    return new config_Validate(attrs);
  }
  static validateApprovalSignatures(attrs) {
    return new ValidateApprovalSignatures(attrs);
  }
  static validationMessaging(attrs) {
    return new ValidationMessaging(attrs);
  }
  static version(attrs) {
    return new Version(attrs);
  }
  static versionControl(attrs) {
    return new VersionControl(attrs);
  }
  static viewerPreferences(attrs) {
    return new ViewerPreferences(attrs);
  }
  static webClient(attrs) {
    return new WebClient(attrs);
  }
  static whitespace(attrs) {
    return new Whitespace(attrs);
  }
  static window(attrs) {
    return new Window(attrs);
  }
  static xdc(attrs) {
    return new Xdc(attrs);
  }
  static xdp(attrs) {
    return new Xdp(attrs);
  }
  static xsl(attrs) {
    return new Xsl(attrs);
  }
  static zpl(attrs) {
    return new Zpl(attrs);
  }
}

;// ./src/core/xfa/connection_set.js


const CONNECTION_SET_NS_ID = NamespaceIds.connectionSet.id;
class ConnectionSet extends XFAObject {
  constructor(attributes) {
    super(CONNECTION_SET_NS_ID, "connectionSet", true);
    this.wsdlConnection = new XFAObjectArray();
    this.xmlConnection = new XFAObjectArray();
    this.xsdConnection = new XFAObjectArray();
  }
}
class EffectiveInputPolicy extends XFAObject {
  constructor(attributes) {
    super(CONNECTION_SET_NS_ID, "effectiveInputPolicy");
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class EffectiveOutputPolicy extends XFAObject {
  constructor(attributes) {
    super(CONNECTION_SET_NS_ID, "effectiveOutputPolicy");
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class Operation extends StringObject {
  constructor(attributes) {
    super(CONNECTION_SET_NS_ID, "operation");
    this.id = attributes.id || "";
    this.input = attributes.input || "";
    this.name = attributes.name || "";
    this.output = attributes.output || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class RootElement extends StringObject {
  constructor(attributes) {
    super(CONNECTION_SET_NS_ID, "rootElement");
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class SoapAction extends StringObject {
  constructor(attributes) {
    super(CONNECTION_SET_NS_ID, "soapAction");
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class SoapAddress extends StringObject {
  constructor(attributes) {
    super(CONNECTION_SET_NS_ID, "soapAddress");
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class connection_set_Uri extends StringObject {
  constructor(attributes) {
    super(CONNECTION_SET_NS_ID, "uri");
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class WsdlAddress extends StringObject {
  constructor(attributes) {
    super(CONNECTION_SET_NS_ID, "wsdlAddress");
    this.id = attributes.id || "";
    this.name = attributes.name || "";
    this.use = attributes.use || "";
    this.usehref = attributes.usehref || "";
  }
}
class WsdlConnection extends XFAObject {
  constructor(attributes) {
    super(CONNECTION_SET_NS_ID, "wsdlConnection", true);
    this.dataDescription = attributes.dataDescription || "";
    this.name = attributes.name || "";
    this.effectiveInputPolicy = null;
    this.effectiveOutputPolicy = null;
    this.operation = null;
    this.soapAction = null;
    this.soapAddress = null;
    this.wsdlAddress = null;
  }
}
class XmlConnection extends XFAObject {
  constructor(attributes) {
    super(CONNECTION_SET_NS_ID, "xmlConnection", true);
    this.dataDescription = attributes.dataDescription || "";
    this.name = attributes.name || "";
    this.uri = null;
  }
}
class XsdConnection extends XFAObject {
  constructor(attributes) {
    super(CONNECTION_SET_NS_ID, "xsdConnection", true);
    this.dataDescription = attributes.dataDescription || "";
    this.name = attributes.name || "";
    this.rootElement = null;
    this.uri = null;
  }
}
class ConnectionSetNamespace {
  static [$buildXFAObject](name, attributes) {
    if (ConnectionSetNamespace.hasOwnProperty(name)) {
      return ConnectionSetNamespace[name](attributes);
    }
    return undefined;
  }
  static connectionSet(attrs) {
    return new ConnectionSet(attrs);
  }
  static effectiveInputPolicy(attrs) {
    return new EffectiveInputPolicy(attrs);
  }
  static effectiveOutputPolicy(attrs) {
    return new EffectiveOutputPolicy(attrs);
  }
  static operation(attrs) {
    return new Operation(attrs);
  }
  static rootElement(attrs) {
    return new RootElement(attrs);
  }
  static soapAction(attrs) {
    return new SoapAction(attrs);
  }
  static soapAddress(attrs) {
    return new SoapAddress(attrs);
  }
  static uri(attrs) {
    return new connection_set_Uri(attrs);
  }
  static wsdlAddress(attrs) {
    return new WsdlAddress(attrs);
  }
  static wsdlConnection(attrs) {
    return new WsdlConnection(attrs);
  }
  static xmlConnection(attrs) {
    return new XmlConnection(attrs);
  }
  static xsdConnection(attrs) {
    return new XsdConnection(attrs);
  }
}

;// ./src/core/xfa/datasets.js



const DATASETS_NS_ID = NamespaceIds.datasets.id;
class datasets_Data extends XmlObject {
  constructor(attributes) {
    super(DATASETS_NS_ID, "data", attributes);
  }
  [$isNsAgnostic]() {
    return true;
  }
}
class Datasets extends XFAObject {
  constructor(attributes) {
    super(DATASETS_NS_ID, "datasets", true);
    this.data = null;
    this.Signature = null;
  }
  [$onChild](child) {
    const name = child[$nodeName];
    if (name === "data" && child[$namespaceId] === DATASETS_NS_ID || name === "Signature" && child[$namespaceId] === NamespaceIds.signature.id) {
      this[name] = child;
    }
    this[$appendChild](child);
  }
}
class DatasetsNamespace {
  static [$buildXFAObject](name, attributes) {
    if (DatasetsNamespace.hasOwnProperty(name)) {
      return DatasetsNamespace[name](attributes);
    }
    return undefined;
  }
  static datasets(attributes) {
    return new Datasets(attributes);
  }
  static data(attributes) {
    return new datasets_Data(attributes);
  }
}

;// ./src/core/xfa/locale_set.js



const LOCALE_SET_NS_ID = NamespaceIds.localeSet.id;
class CalendarSymbols extends XFAObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "calendarSymbols", true);
    this.name = "gregorian";
    this.dayNames = new XFAObjectArray(2);
    this.eraNames = null;
    this.meridiemNames = null;
    this.monthNames = new XFAObjectArray(2);
  }
}
class CurrencySymbol extends StringObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "currencySymbol");
    this.name = getStringOption(attributes.name, ["symbol", "isoname", "decimal"]);
  }
}
class CurrencySymbols extends XFAObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "currencySymbols", true);
    this.currencySymbol = new XFAObjectArray(3);
  }
}
class DatePattern extends StringObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "datePattern");
    this.name = getStringOption(attributes.name, ["full", "long", "med", "short"]);
  }
}
class DatePatterns extends XFAObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "datePatterns", true);
    this.datePattern = new XFAObjectArray(4);
  }
}
class DateTimeSymbols extends ContentObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "dateTimeSymbols");
  }
}
class Day extends StringObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "day");
  }
}
class DayNames extends XFAObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "dayNames", true);
    this.abbr = getInteger({
      data: attributes.abbr,
      defaultValue: 0,
      validate: x => x === 1
    });
    this.day = new XFAObjectArray(7);
  }
}
class Era extends StringObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "era");
  }
}
class EraNames extends XFAObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "eraNames", true);
    this.era = new XFAObjectArray(2);
  }
}
class locale_set_Locale extends XFAObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "locale", true);
    this.desc = attributes.desc || "";
    this.name = "isoname";
    this.calendarSymbols = null;
    this.currencySymbols = null;
    this.datePatterns = null;
    this.dateTimeSymbols = null;
    this.numberPatterns = null;
    this.numberSymbols = null;
    this.timePatterns = null;
    this.typeFaces = null;
  }
}
class locale_set_LocaleSet extends XFAObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "localeSet", true);
    this.locale = new XFAObjectArray();
  }
}
class Meridiem extends StringObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "meridiem");
  }
}
class MeridiemNames extends XFAObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "meridiemNames", true);
    this.meridiem = new XFAObjectArray(2);
  }
}
class Month extends StringObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "month");
  }
}
class MonthNames extends XFAObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "monthNames", true);
    this.abbr = getInteger({
      data: attributes.abbr,
      defaultValue: 0,
      validate: x => x === 1
    });
    this.month = new XFAObjectArray(12);
  }
}
class NumberPattern extends StringObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "numberPattern");
    this.name = getStringOption(attributes.name, ["full", "long", "med", "short"]);
  }
}
class NumberPatterns extends XFAObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "numberPatterns", true);
    this.numberPattern = new XFAObjectArray(4);
  }
}
class NumberSymbol extends StringObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "numberSymbol");
    this.name = getStringOption(attributes.name, ["decimal", "grouping", "percent", "minus", "zero"]);
  }
}
class NumberSymbols extends XFAObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "numberSymbols", true);
    this.numberSymbol = new XFAObjectArray(5);
  }
}
class TimePattern extends StringObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "timePattern");
    this.name = getStringOption(attributes.name, ["full", "long", "med", "short"]);
  }
}
class TimePatterns extends XFAObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "timePatterns", true);
    this.timePattern = new XFAObjectArray(4);
  }
}
class TypeFace extends XFAObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "typeFace", true);
    this.name = attributes.name | "";
  }
}
class TypeFaces extends XFAObject {
  constructor(attributes) {
    super(LOCALE_SET_NS_ID, "typeFaces", true);
    this.typeFace = new XFAObjectArray();
  }
}
class LocaleSetNamespace {
  static [$buildXFAObject](name, attributes) {
    if (LocaleSetNamespace.hasOwnProperty(name)) {
      return LocaleSetNamespace[name](attributes);
    }
    return undefined;
  }
  static calendarSymbols(attrs) {
    return new CalendarSymbols(attrs);
  }
  static currencySymbol(attrs) {
    return new CurrencySymbol(attrs);
  }
  static currencySymbols(attrs) {
    return new CurrencySymbols(attrs);
  }
  static datePattern(attrs) {
    return new DatePattern(attrs);
  }
  static datePatterns(attrs) {
    return new DatePatterns(attrs);
  }
  static dateTimeSymbols(attrs) {
    return new DateTimeSymbols(attrs);
  }
  static day(attrs) {
    return new Day(attrs);
  }
  static dayNames(attrs) {
    return new DayNames(attrs);
  }
  static era(attrs) {
    return new Era(attrs);
  }
  static eraNames(attrs) {
    return new EraNames(attrs);
  }
  static locale(attrs) {
    return new locale_set_Locale(attrs);
  }
  static localeSet(attrs) {
    return new locale_set_LocaleSet(attrs);
  }
  static meridiem(attrs) {
    return new Meridiem(attrs);
  }
  static meridiemNames(attrs) {
    return new MeridiemNames(attrs);
  }
  static month(attrs) {
    return new Month(attrs);
  }
  static monthNames(attrs) {
    return new MonthNames(attrs);
  }
  static numberPattern(attrs) {
    return new NumberPattern(attrs);
  }
  static numberPatterns(attrs) {
    return new NumberPatterns(attrs);
  }
  static numberSymbol(attrs) {
    return new NumberSymbol(attrs);
  }
  static numberSymbols(attrs) {
    return new NumberSymbols(attrs);
  }
  static timePattern(attrs) {
    return new TimePattern(attrs);
  }
  static timePatterns(attrs) {
    return new TimePatterns(attrs);
  }
  static typeFace(attrs) {
    return new TypeFace(attrs);
  }
  static typeFaces(attrs) {
    return new TypeFaces(attrs);
  }
}

;// ./src/core/xfa/signature.js


const SIGNATURE_NS_ID = NamespaceIds.signature.id;
class signature_Signature extends XFAObject {
  constructor(attributes) {
    super(SIGNATURE_NS_ID, "signature", true);
  }
}
class SignatureNamespace {
  static [$buildXFAObject](name, attributes) {
    if (SignatureNamespace.hasOwnProperty(name)) {
      return SignatureNamespace[name](attributes);
    }
    return undefined;
  }
  static signature(attributes) {
    return new signature_Signature(attributes);
  }
}

;// ./src/core/xfa/stylesheet.js


const STYLESHEET_NS_ID = NamespaceIds.stylesheet.id;
class Stylesheet extends XFAObject {
  constructor(attributes) {
    super(STYLESHEET_NS_ID, "stylesheet", true);
  }
}
class StylesheetNamespace {
  static [$buildXFAObject](name, attributes) {
    if (StylesheetNamespace.hasOwnProperty(name)) {
      return StylesheetNamespace[name](attributes);
    }
    return undefined;
  }
  static stylesheet(attributes) {
    return new Stylesheet(attributes);
  }
}

;// ./src/core/xfa/xdp.js



const XDP_NS_ID = NamespaceIds.xdp.id;
class xdp_Xdp extends XFAObject {
  constructor(attributes) {
    super(XDP_NS_ID, "xdp", true);
    this.uuid = attributes.uuid || "";
    this.timeStamp = attributes.timeStamp || "";
    this.config = null;
    this.connectionSet = null;
    this.datasets = null;
    this.localeSet = null;
    this.stylesheet = new XFAObjectArray();
    this.template = null;
  }
  [$onChildCheck](child) {
    const ns = NamespaceIds[child[$nodeName]];
    return ns && child[$namespaceId] === ns.id;
  }
}
class XdpNamespace {
  static [$buildXFAObject](name, attributes) {
    if (XdpNamespace.hasOwnProperty(name)) {
      return XdpNamespace[name](attributes);
    }
    return undefined;
  }
  static xdp(attributes) {
    return new xdp_Xdp(attributes);
  }
}

;// ./src/core/xfa/xhtml.js















const XHTML_NS_ID = NamespaceIds.xhtml.id;
const $richText = Symbol();
const VALID_STYLES = new Set(["color", "font", "font-family", "font-size", "font-stretch", "font-style", "font-weight", "margin", "margin-bottom", "margin-left", "margin-right", "margin-top", "letter-spacing", "line-height", "orphans", "page-break-after", "page-break-before", "page-break-inside", "tab-interval", "tab-stop", "text-align", "text-decoration", "text-indent", "vertical-align", "widows", "kerning-mode", "xfa-font-horizontal-scale", "xfa-font-vertical-scale", "xfa-spacerun", "xfa-tab-stops"]);
const StyleMapping = new Map([["page-break-after", "breakAfter"], ["page-break-before", "breakBefore"], ["page-break-inside", "breakInside"], ["kerning-mode", value => value === "none" ? "none" : "normal"], ["xfa-font-horizontal-scale", value => `scaleX(${Math.max(0, parseInt(value) / 100).toFixed(2)})`], ["xfa-font-vertical-scale", value => `scaleY(${Math.max(0, parseInt(value) / 100).toFixed(2)})`], ["xfa-spacerun", ""], ["xfa-tab-stops", ""], ["font-size", (value, original) => {
  value = original.fontSize = Math.abs(getMeasurement(value));
  return measureToString(0.99 * value);
}], ["letter-spacing", value => measureToString(getMeasurement(value))], ["line-height", value => measureToString(getMeasurement(value))], ["margin", value => measureToString(getMeasurement(value))], ["margin-bottom", value => measureToString(getMeasurement(value))], ["margin-left", value => measureToString(getMeasurement(value))], ["margin-right", value => measureToString(getMeasurement(value))], ["margin-top", value => measureToString(getMeasurement(value))], ["text-indent", value => measureToString(getMeasurement(value))], ["font-family", value => value], ["vertical-align", value => measureToString(getMeasurement(value))]]);
const spacesRegExp = /\s+/g;
const crlfRegExp = /[\r\n]+/g;
const crlfForRichTextRegExp = /\r\n?/g;
function mapStyle(styleStr, node, richText) {
  const style = Object.create(null);
  if (!styleStr) {
    return style;
  }
  const original = Object.create(null);
  for (const [key, value] of styleStr.split(";").map(s => s.split(":", 2))) {
    const mapping = StyleMapping.get(key);
    if (mapping === "") {
      continue;
    }
    let newValue = value;
    if (mapping) {
      newValue = typeof mapping === "string" ? mapping : mapping(value, original);
    }
    if (key.endsWith("scale")) {
      style.transform = style.transform ? `${style[key]} ${newValue}` : newValue;
    } else {
      style[key.replaceAll(/-([a-zA-Z])/g, (_, x) => x.toUpperCase())] = newValue;
    }
  }
  if (style.fontFamily) {
    setFontFamily({
      typeface: style.fontFamily,
      weight: style.fontWeight || "normal",
      posture: style.fontStyle || "normal",
      size: original.fontSize || 0
    }, node, node[$globalData].fontFinder, style);
  }
  if (richText && style.verticalAlign && style.verticalAlign !== "0px" && style.fontSize) {
    const SUB_SUPER_SCRIPT_FACTOR = 0.583;
    const VERTICAL_FACTOR = 0.333;
    const fontSize = getMeasurement(style.fontSize);
    style.fontSize = measureToString(fontSize * SUB_SUPER_SCRIPT_FACTOR);
    style.verticalAlign = measureToString(Math.sign(getMeasurement(style.verticalAlign)) * fontSize * VERTICAL_FACTOR);
  }
  if (richText && style.fontSize) {
    style.fontSize = `calc(${style.fontSize} * var(--total-scale-factor))`;
  }
  fixTextIndent(style);
  return style;
}
function checkStyle(node) {
  if (!node.style) {
    return "";
  }
  return node.style.split(";").filter(s => !!s.trim()).map(s => s.split(":", 2).map(t => t.trim())).filter(([key, value]) => {
    if (key === "font-family") {
      node[$globalData].usedTypefaces.add(value);
    }
    return VALID_STYLES.has(key);
  }).map(kv => kv.join(":")).join(";");
}
const NoWhites = new Set(["body", "html"]);
class XhtmlObject extends XmlObject {
  constructor(attributes, name) {
    super(XHTML_NS_ID, name);
    this[$richText] = false;
    this.style = attributes.style || "";
  }
  [$clean](builder) {
    super[$clean](builder);
    this.style = checkStyle(this);
  }
  [$acceptWhitespace]() {
    return !NoWhites.has(this[$nodeName]);
  }
  [$onText](str, richText = false) {
    if (!richText) {
      str = str.replaceAll(crlfRegExp, "");
      if (!this.style.includes("xfa-spacerun:yes")) {
        str = str.replaceAll(spacesRegExp, " ");
      }
    } else {
      this[$richText] = true;
    }
    if (str) {
      this[$content] += str;
    }
  }
  [$pushGlyphs](measure, mustPop = true) {
    const xfaFont = Object.create(null);
    const margin = {
      top: NaN,
      bottom: NaN,
      left: NaN,
      right: NaN
    };
    let lineHeight = null;
    for (const [key, value] of this.style.split(";").map(s => s.split(":", 2))) {
      switch (key) {
        case "font-family":
          xfaFont.typeface = stripQuotes(value);
          break;
        case "font-size":
          xfaFont.size = getMeasurement(value);
          break;
        case "font-weight":
          xfaFont.weight = value;
          break;
        case "font-style":
          xfaFont.posture = value;
          break;
        case "letter-spacing":
          xfaFont.letterSpacing = getMeasurement(value);
          break;
        case "margin":
          const values = value.split(/ \t/).map(x => getMeasurement(x));
          switch (values.length) {
            case 1:
              margin.top = margin.bottom = margin.left = margin.right = values[0];
              break;
            case 2:
              margin.top = margin.bottom = values[0];
              margin.left = margin.right = values[1];
              break;
            case 3:
              margin.top = values[0];
              margin.bottom = values[2];
              margin.left = margin.right = values[1];
              break;
            case 4:
              margin.top = values[0];
              margin.left = values[1];
              margin.bottom = values[2];
              margin.right = values[3];
              break;
          }
          break;
        case "margin-top":
          margin.top = getMeasurement(value);
          break;
        case "margin-bottom":
          margin.bottom = getMeasurement(value);
          break;
        case "margin-left":
          margin.left = getMeasurement(value);
          break;
        case "margin-right":
          margin.right = getMeasurement(value);
          break;
        case "line-height":
          lineHeight = getMeasurement(value);
          break;
      }
    }
    measure.pushData(xfaFont, margin, lineHeight);
    if (this[$content]) {
      measure.addString(this[$content]);
    } else {
      for (const child of this[$getChildren]()) {
        if (child[$nodeName] === "#text") {
          measure.addString(child[$content]);
          continue;
        }
        child[$pushGlyphs](measure);
      }
    }
    if (mustPop) {
      measure.popFont();
    }
  }
  [$toHTML](availableSpace) {
    const children = [];
    this[$extra] = {
      children
    };
    this[$childrenToHTML]({});
    if (children.length === 0 && !this[$content]) {
      return HTMLResult.EMPTY;
    }
    let value;
    if (this[$richText]) {
      value = this[$content] ? this[$content].replaceAll(crlfForRichTextRegExp, "\n") : undefined;
    } else {
      value = this[$content] || undefined;
    }
    return HTMLResult.success({
      name: this[$nodeName],
      attributes: {
        href: this.href,
        style: mapStyle(this.style, this, this[$richText])
      },
      children,
      value
    });
  }
}
class A extends XhtmlObject {
  constructor(attributes) {
    super(attributes, "a");
    this.href = fixURL(attributes.href) || "";
  }
}
class B extends XhtmlObject {
  constructor(attributes) {
    super(attributes, "b");
  }
  [$pushGlyphs](measure) {
    measure.pushFont({
      weight: "bold"
    });
    super[$pushGlyphs](measure);
    measure.popFont();
  }
}
class Body extends XhtmlObject {
  constructor(attributes) {
    super(attributes, "body");
  }
  [$toHTML](availableSpace) {
    const res = super[$toHTML](availableSpace);
    const {
      html
    } = res;
    if (!html) {
      return HTMLResult.EMPTY;
    }
    html.name = "div";
    html.attributes.class = ["xfaRich"];
    return res;
  }
}
class Br extends XhtmlObject {
  constructor(attributes) {
    super(attributes, "br");
  }
  [$text]() {
    return "\n";
  }
  [$pushGlyphs](measure) {
    measure.addString("\n");
  }
  [$toHTML](availableSpace) {
    return HTMLResult.success({
      name: "br"
    });
  }
}
class Html extends XhtmlObject {
  constructor(attributes) {
    super(attributes, "html");
  }
  [$toHTML](availableSpace) {
    const children = [];
    this[$extra] = {
      children
    };
    this[$childrenToHTML]({});
    if (children.length === 0) {
      return HTMLResult.success({
        name: "div",
        attributes: {
          class: ["xfaRich"],
          style: {}
        },
        value: this[$content] || ""
      });
    }
    if (children.length === 1) {
      const child = children[0];
      if (child.attributes?.class.includes("xfaRich")) {
        return HTMLResult.success(child);
      }
    }
    return HTMLResult.success({
      name: "div",
      attributes: {
        class: ["xfaRich"],
        style: {}
      },
      children
    });
  }
}
class I extends XhtmlObject {
  constructor(attributes) {
    super(attributes, "i");
  }
  [$pushGlyphs](measure) {
    measure.pushFont({
      posture: "italic"
    });
    super[$pushGlyphs](measure);
    measure.popFont();
  }
}
class Li extends XhtmlObject {
  constructor(attributes) {
    super(attributes, "li");
  }
}
class Ol extends XhtmlObject {
  constructor(attributes) {
    super(attributes, "ol");
  }
}
class P extends XhtmlObject {
  constructor(attributes) {
    super(attributes, "p");
  }
  [$pushGlyphs](measure) {
    super[$pushGlyphs](measure, false);
    measure.addString("\n");
    measure.addPara();
    measure.popFont();
  }
  [$text]() {
    const siblings = this[$getParent]()[$getChildren]();
    if (siblings.at(-1) === this) {
      return super[$text]();
    }
    return super[$text]() + "\n";
  }
}
class Span extends XhtmlObject {
  constructor(attributes) {
    super(attributes, "span");
  }
}
class Sub extends XhtmlObject {
  constructor(attributes) {
    super(attributes, "sub");
  }
}
class Sup extends XhtmlObject {
  constructor(attributes) {
    super(attributes, "sup");
  }
}
class Ul extends XhtmlObject {
  constructor(attributes) {
    super(attributes, "ul");
  }
}
class XhtmlNamespace {
  static [$buildXFAObject](name, attributes) {
    if (XhtmlNamespace.hasOwnProperty(name)) {
      return XhtmlNamespace[name](attributes);
    }
    return undefined;
  }
  static a(attributes) {
    return new A(attributes);
  }
  static b(attributes) {
    return new B(attributes);
  }
  static body(attributes) {
    return new Body(attributes);
  }
  static br(attributes) {
    return new Br(attributes);
  }
  static html(attributes) {
    return new Html(attributes);
  }
  static i(attributes) {
    return new I(attributes);
  }
  static li(attributes) {
    return new Li(attributes);
  }
  static ol(attributes) {
    return new Ol(attributes);
  }
  static p(attributes) {
    return new P(attributes);
  }
  static span(attributes) {
    return new Span(attributes);
  }
  static sub(attributes) {
    return new Sub(attributes);
  }
  static sup(attributes) {
    return new Sup(attributes);
  }
  static ul(attributes) {
    return new Ul(attributes);
  }
}

;// ./src/core/xfa/setup.js









const NamespaceSetUp = {
  config: ConfigNamespace,
  connection: ConnectionSetNamespace,
  datasets: DatasetsNamespace,
  localeSet: LocaleSetNamespace,
  signature: SignatureNamespace,
  stylesheet: StylesheetNamespace,
  template: TemplateNamespace,
  xdp: XdpNamespace,
  xhtml: XhtmlNamespace
};

;// ./src/core/xfa/unknown.js


class UnknownNamespace {
  constructor(nsId) {
    this.namespaceId = nsId;
  }
  [$buildXFAObject](name, attributes) {
    return new XmlObject(this.namespaceId, name, attributes);
  }
}

;// ./src/core/xfa/builder.js











class Root extends XFAObject {
  constructor(ids) {
    super(-1, "root", Object.create(null));
    this.element = null;
    this[$ids] = ids;
  }
  [$onChild](child) {
    this.element = child;
    return true;
  }
  [$finalize]() {
    super[$finalize]();
    if (this.element.template instanceof Template) {
      this[$ids].set($root, this.element);
      this.element.template[$resolvePrototypes](this[$ids]);
      this.element.template[$ids] = this[$ids];
    }
  }
}
class Empty extends XFAObject {
  constructor() {
    super(-1, "", Object.create(null));
  }
  [$onChild](_) {
    return false;
  }
}
class Builder {
  constructor(rootNameSpace = null) {
    this._namespaceStack = [];
    this._nsAgnosticLevel = 0;
    this._namespacePrefixes = new Map();
    this._namespaces = new Map();
    this._nextNsId = Math.max(...Object.values(NamespaceIds).map(({
      id
    }) => id));
    this._currentNamespace = rootNameSpace || new UnknownNamespace(++this._nextNsId);
  }
  buildRoot(ids) {
    return new Root(ids);
  }
  build({
    nsPrefix,
    name,
    attributes,
    namespace,
    prefixes
  }) {
    const hasNamespaceDef = namespace !== null;
    if (hasNamespaceDef) {
      this._namespaceStack.push(this._currentNamespace);
      this._currentNamespace = this._searchNamespace(namespace);
    }
    if (prefixes) {
      this._addNamespacePrefix(prefixes);
    }
    if (attributes.hasOwnProperty($nsAttributes)) {
      const dataTemplate = NamespaceSetUp.datasets;
      const nsAttrs = attributes[$nsAttributes];
      let xfaAttrs = null;
      for (const [ns, attrs] of Object.entries(nsAttrs)) {
        const nsToUse = this._getNamespaceToUse(ns);
        if (nsToUse === dataTemplate) {
          xfaAttrs = {
            xfa: attrs
          };
          break;
        }
      }
      if (xfaAttrs) {
        attributes[$nsAttributes] = xfaAttrs;
      } else {
        delete attributes[$nsAttributes];
      }
    }
    const namespaceToUse = this._getNamespaceToUse(nsPrefix);
    const node = namespaceToUse?.[$buildXFAObject](name, attributes) || new Empty();
    if (node[$isNsAgnostic]()) {
      this._nsAgnosticLevel++;
    }
    if (hasNamespaceDef || prefixes || node[$isNsAgnostic]()) {
      node[$cleanup] = {
        hasNamespace: hasNamespaceDef,
        prefixes,
        nsAgnostic: node[$isNsAgnostic]()
      };
    }
    return node;
  }
  isNsAgnostic() {
    return this._nsAgnosticLevel > 0;
  }
  _searchNamespace(nsName) {
    let ns = this._namespaces.get(nsName);
    if (ns) {
      return ns;
    }
    for (const [name, {
      check
    }] of Object.entries(NamespaceIds)) {
      if (check(nsName)) {
        ns = NamespaceSetUp[name];
        if (ns) {
          this._namespaces.set(nsName, ns);
          return ns;
        }
        break;
      }
    }
    ns = new UnknownNamespace(++this._nextNsId);
    this._namespaces.set(nsName, ns);
    return ns;
  }
  _addNamespacePrefix(prefixes) {
    for (const {
      prefix,
      value
    } of prefixes) {
      const namespace = this._searchNamespace(value);
      let prefixStack = this._namespacePrefixes.get(prefix);
      if (!prefixStack) {
        prefixStack = [];
        this._namespacePrefixes.set(prefix, prefixStack);
      }
      prefixStack.push(namespace);
    }
  }
  _getNamespaceToUse(prefix) {
    if (!prefix) {
      return this._currentNamespace;
    }
    const prefixStack = this._namespacePrefixes.get(prefix);
    if (prefixStack?.length > 0) {
      return prefixStack.at(-1);
    }
    warn(`Unknown namespace prefix: ${prefix}.`);
    return null;
  }
  clean(data) {
    const {
      hasNamespace,
      prefixes,
      nsAgnostic
    } = data;
    if (hasNamespace) {
      this._currentNamespace = this._namespaceStack.pop();
    }
    if (prefixes) {
      prefixes.forEach(({
        prefix
      }) => {
        this._namespacePrefixes.get(prefix).pop();
      });
    }
    if (nsAgnostic) {
      this._nsAgnosticLevel--;
    }
  }
}

;// ./src/core/xfa/parser.js












class XFAParser extends XMLParserBase {
  constructor(rootNameSpace = null, richText = false) {
    super();
    this._builder = new Builder(rootNameSpace);
    this._stack = [];
    this._globalData = {
      usedTypefaces: new Set()
    };
    this._ids = new Map();
    this._current = this._builder.buildRoot(this._ids);
    this._errorCode = XMLParserErrorCode.NoError;
    this._whiteRegex = /^\s+$/;
    this._nbsps = /\xa0+/g;
    this._richText = richText;
  }
  parse(data) {
    this.parseXml(data);
    if (this._errorCode !== XMLParserErrorCode.NoError) {
      return undefined;
    }
    this._current[$finalize]();
    return this._current.element;
  }
  onText(text) {
    text = text.replace(this._nbsps, match => match.slice(1) + " ");
    if (this._richText || this._current[$acceptWhitespace]()) {
      this._current[$onText](text, this._richText);
      return;
    }
    if (this._whiteRegex.test(text)) {
      return;
    }
    this._current[$onText](text.trim());
  }
  onCdata(text) {
    this._current[$onText](text);
  }
  _mkAttributes(attributes, tagName) {
    let namespace = null;
    let prefixes = null;
    const attributeObj = Object.create({});
    for (const {
      name,
      value
    } of attributes) {
      if (name === "xmlns") {
        if (!namespace) {
          namespace = value;
        } else {
          warn(`XFA - multiple namespace definition in <${tagName}>`);
        }
      } else if (name.startsWith("xmlns:")) {
        const prefix = name.substring("xmlns:".length);
        prefixes ??= [];
        prefixes.push({
          prefix,
          value
        });
      } else {
        const i = name.indexOf(":");
        if (i === -1) {
          attributeObj[name] = value;
        } else {
          const nsAttrs = attributeObj[$nsAttributes] ??= Object.create(null);
          const [ns, attrName] = [name.slice(0, i), name.slice(i + 1)];
          const attrs = nsAttrs[ns] ||= Object.create(null);
          attrs[attrName] = value;
        }
      }
    }
    return [namespace, prefixes, attributeObj];
  }
  _getNameAndPrefix(name, nsAgnostic) {
    const i = name.indexOf(":");
    if (i === -1) {
      return [name, null];
    }
    return [name.substring(i + 1), nsAgnostic ? "" : name.substring(0, i)];
  }
  onBeginElement(tagName, attributes, isEmpty) {
    const [namespace, prefixes, attributesObj] = this._mkAttributes(attributes, tagName);
    const [name, nsPrefix] = this._getNameAndPrefix(tagName, this._builder.isNsAgnostic());
    const node = this._builder.build({
      nsPrefix,
      name,
      attributes: attributesObj,
      namespace,
      prefixes
    });
    node[$globalData] = this._globalData;
    if (isEmpty) {
      node[$finalize]();
      if (this._current[$onChild](node)) {
        node[$setId](this._ids);
      }
      node[$clean](this._builder);
      return;
    }
    this._stack.push(this._current);
    this._current = node;
  }
  onEndElement(name) {
    const node = this._current;
    if (node[$isCDATAXml]() && typeof node[$content] === "string") {
      const parser = new XFAParser();
      parser._globalData = this._globalData;
      const root = parser.parse(node[$content]);
      node[$content] = null;
      node[$onChild](root);
    }
    node[$finalize]();
    this._current = this._stack.pop();
    if (this._current[$onChild](node)) {
      node[$setId](this._ids);
    }
    node[$clean](this._builder);
  }
  onError(code) {
    this._errorCode = code;
  }
}

;// ./src/core/xfa/factory.js













class XFAFactory {
  constructor(data) {
    try {
      this.root = new XFAParser().parse(XFAFactory._createDocument(data));
      const binder = new Binder(this.root);
      this.form = binder.bind();
      this.dataHandler = new DataHandler(this.root, binder.getData());
      this.form[$globalData].template = this.form;
    } catch (e) {
      warn(`XFA - an error occurred during parsing and binding: ${e}`);
    }
  }
  isValid() {
    return !!(this.root && this.form);
  }
  _createPagesHelper() {
    const iterator = this.form[$toPages]();
    return new Promise((resolve, reject) => {
      const nextIteration = () => {
        try {
          const value = iterator.next();
          if (value.done) {
            resolve(value.value);
          } else {
            setTimeout(nextIteration, 0);
          }
        } catch (e) {
          reject(e);
        }
      };
      setTimeout(nextIteration, 0);
    });
  }
  async _createPages() {
    try {
      this.pages = await this._createPagesHelper();
      this.dims = this.pages.children.map(c => {
        const {
          width,
          height
        } = c.attributes.style;
        return [0, 0, parseInt(width), parseInt(height)];
      });
    } catch (e) {
      warn(`XFA - an error occurred during layout: ${e}`);
    }
  }
  getBoundingBox(pageIndex) {
    return this.dims[pageIndex];
  }
  async getNumPages() {
    if (!this.pages) {
      await this._createPages();
    }
    return this.dims.length;
  }
  setImages(images) {
    this.form[$globalData].images = images;
  }
  setFonts(fonts) {
    this.form[$globalData].fontFinder = new FontFinder(fonts);
    const missingFonts = [];
    for (let typeface of this.form[$globalData].usedTypefaces) {
      typeface = stripQuotes(typeface);
      const font = this.form[$globalData].fontFinder.find(typeface);
      if (!font) {
        missingFonts.push(typeface);
      }
    }
    if (missingFonts.length > 0) {
      return missingFonts;
    }
    return null;
  }
  appendFonts(fonts, reallyMissingFonts) {
    this.form[$globalData].fontFinder.add(fonts, reallyMissingFonts);
  }
  async getPages() {
    if (!this.pages) {
      await this._createPages();
    }
    const pages = this.pages;
    this.pages = null;
    return pages;
  }
  serializeData(storage) {
    return this.dataHandler.serialize(storage);
  }
  static _createDocument(data) {
    if (!data["/xdp:xdp"]) {
      return data["xdp:xdp"];
    }
    return Object.values(data).join("");
  }
  static getRichTextAsHtml(rc) {
    if (!rc || typeof rc !== "string") {
      return null;
    }
    try {
      let root = new XFAParser(XhtmlNamespace, true).parse(rc);
      if (!["body", "xhtml"].includes(root[$nodeName])) {
        const newRoot = XhtmlNamespace.body({});
        newRoot[$appendChild](root);
        root = newRoot;
      }
      const result = root[$toHTML]();
      if (!result.success) {
        return null;
      }
      const {
        html
      } = result;
      const {
        attributes
      } = html;
      if (attributes) {
        if (attributes.class) {
          attributes.class = attributes.class.filter(attr => !attr.startsWith("xfa"));
        }
        attributes.dir = "auto";
      }
      return {
        html,
        str: root[$text]()
      };
    } catch (e) {
      warn(`XFA - an error occurred during parsing of rich text: ${e}`);
    }
    return null;
  }
}

;// ./src/core/annotation.js




























class AnnotationFactory {
  static createGlobals(pdfManager) {
    return Promise.all([pdfManager.ensureCatalog("acroForm"), pdfManager.ensureDoc("xfaDatasets"), pdfManager.ensureCatalog("structTreeRoot"), pdfManager.ensureCatalog("baseUrl"), pdfManager.ensureCatalog("attachments"), pdfManager.ensureCatalog("globalColorSpaceCache")]).then(([acroForm, xfaDatasets, structTreeRoot, baseUrl, attachments, globalColorSpaceCache]) => ({
      pdfManager,
      acroForm: acroForm instanceof Dict ? acroForm : Dict.empty,
      xfaDatasets,
      structTreeRoot,
      baseUrl,
      attachments,
      globalColorSpaceCache
    }), reason => {
      warn(`createGlobals: "${reason}".`);
      return null;
    });
  }
  static async create(xref, ref, annotationGlobals, idFactory, collectFields, orphanFields, pageRef) {
    const pageIndex = collectFields ? await this._getPageIndex(xref, ref, annotationGlobals.pdfManager) : null;
    return annotationGlobals.pdfManager.ensure(this, "_create", [xref, ref, annotationGlobals, idFactory, collectFields, orphanFields, pageIndex, pageRef]);
  }
  static _create(xref, ref, annotationGlobals, idFactory, collectFields = false, orphanFields = null, pageIndex = null, pageRef = null) {
    const dict = xref.fetchIfRef(ref);
    if (!(dict instanceof Dict)) {
      return undefined;
    }
    const {
      acroForm,
      pdfManager
    } = annotationGlobals;
    const id = ref instanceof Ref ? ref.toString() : `annot_${idFactory.createObjId()}`;
    let subtype = dict.get("Subtype");
    subtype = subtype instanceof Name ? subtype.name : null;
    const parameters = {
      xref,
      ref,
      dict,
      subtype,
      id,
      annotationGlobals,
      collectFields,
      orphanFields,
      needAppearances: !collectFields && acroForm.get("NeedAppearances") === true,
      pageIndex,
      evaluatorOptions: pdfManager.evaluatorOptions,
      pageRef
    };
    switch (subtype) {
      case "Link":
        return new LinkAnnotation(parameters);
      case "Text":
        return new TextAnnotation(parameters);
      case "Widget":
        let fieldType = getInheritableProperty({
          dict,
          key: "FT"
        });
        fieldType = fieldType instanceof Name ? fieldType.name : null;
        switch (fieldType) {
          case "Tx":
            return new TextWidgetAnnotation(parameters);
          case "Btn":
            return new ButtonWidgetAnnotation(parameters);
          case "Ch":
            return new ChoiceWidgetAnnotation(parameters);
          case "Sig":
            return new SignatureWidgetAnnotation(parameters);
        }
        warn(`Unimplemented widget field type "${fieldType}", ` + "falling back to base field type.");
        return new WidgetAnnotation(parameters);
      case "Popup":
        return new PopupAnnotation(parameters);
      case "FreeText":
        return new FreeTextAnnotation(parameters);
      case "Line":
        return new LineAnnotation(parameters);
      case "Square":
        return new SquareAnnotation(parameters);
      case "Circle":
        return new CircleAnnotation(parameters);
      case "PolyLine":
        return new PolylineAnnotation(parameters);
      case "Polygon":
        return new PolygonAnnotation(parameters);
      case "Caret":
        return new CaretAnnotation(parameters);
      case "Ink":
        return new InkAnnotation(parameters);
      case "Highlight":
        return new HighlightAnnotation(parameters);
      case "Underline":
        return new UnderlineAnnotation(parameters);
      case "Squiggly":
        return new SquigglyAnnotation(parameters);
      case "StrikeOut":
        return new StrikeOutAnnotation(parameters);
      case "Stamp":
        return new StampAnnotation(parameters);
      case "FileAttachment":
        return new FileAttachmentAnnotation(parameters);
      default:
        if (!collectFields) {
          if (!subtype) {
            warn("Annotation is missing the required /Subtype.");
          } else {
            warn(`Unimplemented annotation type "${subtype}", ` + "falling back to base annotation.");
          }
        }
        return new Annotation(parameters);
    }
  }
  static async _getPageIndex(xref, ref, pdfManager) {
    try {
      const annotDict = await xref.fetchIfRefAsync(ref);
      if (!(annotDict instanceof Dict)) {
        return -1;
      }
      const pageRef = annotDict.getRaw("P");
      if (pageRef instanceof Ref) {
        try {
          const pageIndex = await pdfManager.ensureCatalog("getPageIndex", [pageRef]);
          return pageIndex;
        } catch (ex) {
          info(`_getPageIndex -- not a valid page reference: "${ex}".`);
        }
      }
      if (annotDict.has("Kids")) {
        return -1;
      }
      const numPages = await pdfManager.ensureDoc("numPages");
      for (let pageIndex = 0; pageIndex < numPages; pageIndex++) {
        const page = await pdfManager.getPage(pageIndex);
        const annotations = await pdfManager.ensure(page, "annotations");
        for (const annotRef of annotations) {
          if (annotRef instanceof Ref && isRefsEqual(annotRef, ref)) {
            return pageIndex;
          }
        }
      }
    } catch (ex) {
      warn(`_getPageIndex: "${ex}".`);
    }
    return -1;
  }
  static generateImages(annotations, xref, isOffscreenCanvasSupported) {
    if (!isOffscreenCanvasSupported) {
      warn("generateImages: OffscreenCanvas is not supported, cannot save or print some annotations with images.");
      return null;
    }
    let imagePromises;
    for (const {
      bitmapId,
      bitmap
    } of annotations) {
      if (!bitmap) {
        continue;
      }
      imagePromises ||= new Map();
      imagePromises.set(bitmapId, StampAnnotation.createImage(bitmap, xref));
    }
    return imagePromises;
  }
  static async saveNewAnnotations(evaluator, task, annotations, imagePromises, changes) {
    const xref = evaluator.xref;
    let baseFontRef;
    const promises = [];
    const {
      isOffscreenCanvasSupported
    } = evaluator.options;
    for (const annotation of annotations) {
      if (annotation.deleted) {
        continue;
      }
      switch (annotation.annotationType) {
        case AnnotationEditorType.FREETEXT:
          if (!baseFontRef) {
            const baseFont = new Dict(xref);
            baseFont.set("BaseFont", Name.get("Helvetica"));
            baseFont.set("Type", Name.get("Font"));
            baseFont.set("Subtype", Name.get("Type1"));
            baseFont.set("Encoding", Name.get("WinAnsiEncoding"));
            baseFontRef = xref.getNewTemporaryRef();
            changes.put(baseFontRef, {
              data: baseFont
            });
          }
          promises.push(FreeTextAnnotation.createNewAnnotation(xref, annotation, changes, {
            evaluator,
            task,
            baseFontRef
          }));
          break;
        case AnnotationEditorType.HIGHLIGHT:
          if (annotation.quadPoints) {
            promises.push(HighlightAnnotation.createNewAnnotation(xref, annotation, changes));
          } else {
            promises.push(InkAnnotation.createNewAnnotation(xref, annotation, changes));
          }
          break;
        case AnnotationEditorType.INK:
          promises.push(InkAnnotation.createNewAnnotation(xref, annotation, changes));
          break;
        case AnnotationEditorType.STAMP:
          const image = isOffscreenCanvasSupported ? await imagePromises?.get(annotation.bitmapId) : null;
          if (image?.imageStream) {
            const {
              imageStream,
              smaskStream
            } = image;
            if (smaskStream) {
              const smaskRef = xref.getNewTemporaryRef();
              changes.put(smaskRef, {
                data: smaskStream
              });
              imageStream.dict.set("SMask", smaskRef);
            }
            const imageRef = image.imageRef = xref.getNewTemporaryRef();
            changes.put(imageRef, {
              data: imageStream
            });
            image.imageStream = image.smaskStream = null;
          }
          promises.push(StampAnnotation.createNewAnnotation(xref, annotation, changes, {
            image
          }));
          break;
        case AnnotationEditorType.SIGNATURE:
          promises.push(StampAnnotation.createNewAnnotation(xref, annotation, changes, {}));
          break;
      }
    }
    return {
      annotations: await Promise.all(promises)
    };
  }
  static async printNewAnnotations(annotationGlobals, evaluator, task, annotations, imagePromises) {
    if (!annotations) {
      return null;
    }
    const {
      options,
      xref
    } = evaluator;
    const promises = [];
    for (const annotation of annotations) {
      if (annotation.deleted) {
        continue;
      }
      switch (annotation.annotationType) {
        case AnnotationEditorType.FREETEXT:
          promises.push(FreeTextAnnotation.createNewPrintAnnotation(annotationGlobals, xref, annotation, {
            evaluator,
            task,
            evaluatorOptions: options
          }));
          break;
        case AnnotationEditorType.HIGHLIGHT:
          if (annotation.quadPoints) {
            promises.push(HighlightAnnotation.createNewPrintAnnotation(annotationGlobals, xref, annotation, {
              evaluatorOptions: options
            }));
          } else {
            promises.push(InkAnnotation.createNewPrintAnnotation(annotationGlobals, xref, annotation, {
              evaluatorOptions: options
            }));
          }
          break;
        case AnnotationEditorType.INK:
          promises.push(InkAnnotation.createNewPrintAnnotation(annotationGlobals, xref, annotation, {
            evaluatorOptions: options
          }));
          break;
        case AnnotationEditorType.STAMP:
          const image = options.isOffscreenCanvasSupported ? await imagePromises?.get(annotation.bitmapId) : null;
          if (image?.imageStream) {
            const {
              imageStream,
              smaskStream
            } = image;
            if (smaskStream) {
              imageStream.dict.set("SMask", smaskStream);
            }
            image.imageRef = new JpegStream(imageStream, imageStream.length);
            image.imageStream = image.smaskStream = null;
          }
          promises.push(StampAnnotation.createNewPrintAnnotation(annotationGlobals, xref, annotation, {
            image,
            evaluatorOptions: options
          }));
          break;
        case AnnotationEditorType.SIGNATURE:
          promises.push(StampAnnotation.createNewPrintAnnotation(annotationGlobals, xref, annotation, {
            evaluatorOptions: options
          }));
          break;
      }
    }
    return Promise.all(promises);
  }
}
function getRgbColor(color, defaultColor = new Uint8ClampedArray(3)) {
  if (!Array.isArray(color)) {
    return defaultColor;
  }
  const rgbColor = defaultColor || new Uint8ClampedArray(3);
  switch (color.length) {
    case 0:
      return null;
    case 1:
      ColorSpaceUtils.gray.getRgbItem(color, 0, rgbColor, 0);
      return rgbColor;
    case 3:
      ColorSpaceUtils.rgb.getRgbItem(color, 0, rgbColor, 0);
      return rgbColor;
    case 4:
      ColorSpaceUtils.cmyk.getRgbItem(color, 0, rgbColor, 0);
      return rgbColor;
    default:
      return defaultColor;
  }
}
function getPdfColorArray(color) {
  return Array.from(color, c => c / 255);
}
function getQuadPoints(dict, rect) {
  const quadPoints = dict.getArray("QuadPoints");
  if (!isNumberArray(quadPoints, null) || quadPoints.length === 0 || quadPoints.length % 8 > 0) {
    return null;
  }
  const newQuadPoints = new Float32Array(quadPoints.length);
  for (let i = 0, ii = quadPoints.length; i < ii; i += 8) {
    const [x1, y1, x2, y2, x3, y3, x4, y4] = quadPoints.slice(i, i + 8);
    const minX = Math.min(x1, x2, x3, x4);
    const maxX = Math.max(x1, x2, x3, x4);
    const minY = Math.min(y1, y2, y3, y4);
    const maxY = Math.max(y1, y2, y3, y4);
    if (rect !== null && (minX < rect[0] || maxX > rect[2] || minY < rect[1] || maxY > rect[3])) {
      return null;
    }
    newQuadPoints.set([minX, maxY, maxX, maxY, minX, minY, maxX, minY], i);
  }
  return newQuadPoints;
}
function getTransformMatrix(rect, bbox, matrix) {
  const minMax = new Float32Array([Infinity, Infinity, -Infinity, -Infinity]);
  Util.axialAlignedBoundingBox(bbox, matrix, minMax);
  const [minX, minY, maxX, maxY] = minMax;
  if (minX === maxX || minY === maxY) {
    return [1, 0, 0, 1, rect[0], rect[1]];
  }
  const xRatio = (rect[2] - rect[0]) / (maxX - minX);
  const yRatio = (rect[3] - rect[1]) / (maxY - minY);
  return [xRatio, 0, 0, yRatio, rect[0] - minX * xRatio, rect[1] - minY * yRatio];
}
class Annotation {
  constructor(params) {
    const {
      dict,
      xref,
      annotationGlobals,
      ref,
      orphanFields
    } = params;
    const parentRef = orphanFields?.get(ref);
    if (parentRef) {
      dict.set("Parent", parentRef);
    }
    this.setTitle(dict.get("T"));
    this.setContents(dict.get("Contents"));
    this.setModificationDate(dict.get("M"));
    this.setFlags(dict.get("F"));
    this.setRectangle(dict.getArray("Rect"));
    this.setColor(dict.getArray("C"));
    this.setBorderStyle(dict);
    this.setAppearance(dict);
    this.setOptionalContent(dict);
    const MK = dict.get("MK");
    this.setBorderAndBackgroundColors(MK);
    this.setRotation(MK, dict);
    this.ref = params.ref instanceof Ref ? params.ref : null;
    this._streams = [];
    if (this.appearance) {
      this._streams.push(this.appearance);
    }
    const isLocked = !!(this.flags & AnnotationFlag.LOCKED);
    const isContentLocked = !!(this.flags & AnnotationFlag.LOCKEDCONTENTS);
    this.data = {
      annotationFlags: this.flags,
      borderStyle: this.borderStyle,
      color: this.color,
      backgroundColor: this.backgroundColor,
      borderColor: this.borderColor,
      rotation: this.rotation,
      contentsObj: this._contents,
      hasAppearance: !!this.appearance,
      id: params.id,
      modificationDate: this.modificationDate,
      rect: this.rectangle,
      subtype: params.subtype,
      hasOwnCanvas: false,
      noRotate: !!(this.flags & AnnotationFlag.NOROTATE),
      noHTML: isLocked && isContentLocked,
      isEditable: false,
      structParent: -1
    };
    if (annotationGlobals.structTreeRoot) {
      let structParent = dict.get("StructParent");
      this.data.structParent = structParent = Number.isInteger(structParent) && structParent >= 0 ? structParent : -1;
      annotationGlobals.structTreeRoot.addAnnotationIdToPage(params.pageRef, structParent);
    }
    if (params.collectFields) {
      const kids = dict.get("Kids");
      if (Array.isArray(kids)) {
        const kidIds = [];
        for (const kid of kids) {
          if (kid instanceof Ref) {
            kidIds.push(kid.toString());
          }
        }
        if (kidIds.length !== 0) {
          this.data.kidIds = kidIds;
        }
      }
      this.data.actions = collectActions(xref, dict, AnnotationActionEventType);
      this.data.fieldName = this._constructFieldName(dict);
      this.data.pageIndex = params.pageIndex;
    }
    const it = dict.get("IT");
    if (it instanceof Name) {
      this.data.it = it.name;
    }
    this._isOffscreenCanvasSupported = params.evaluatorOptions.isOffscreenCanvasSupported;
    this._fallbackFontDict = null;
    this._needAppearances = false;
  }
  _hasFlag(flags, flag) {
    return !!(flags & flag);
  }
  _buildFlags(noView, noPrint) {
    let {
      flags
    } = this;
    if (noView === undefined) {
      if (noPrint === undefined) {
        return undefined;
      }
      if (noPrint) {
        return flags & ~AnnotationFlag.PRINT;
      }
      return flags & ~AnnotationFlag.HIDDEN | AnnotationFlag.PRINT;
    }
    if (noView) {
      flags |= AnnotationFlag.PRINT;
      if (noPrint) {
        return flags & ~AnnotationFlag.NOVIEW | AnnotationFlag.HIDDEN;
      }
      return flags & ~AnnotationFlag.HIDDEN | AnnotationFlag.NOVIEW;
    }
    flags &= ~(AnnotationFlag.HIDDEN | AnnotationFlag.NOVIEW);
    if (noPrint) {
      return flags & ~AnnotationFlag.PRINT;
    }
    return flags | AnnotationFlag.PRINT;
  }
  _isViewable(flags) {
    return !this._hasFlag(flags, AnnotationFlag.INVISIBLE) && !this._hasFlag(flags, AnnotationFlag.NOVIEW);
  }
  _isPrintable(flags) {
    return this._hasFlag(flags, AnnotationFlag.PRINT) && !this._hasFlag(flags, AnnotationFlag.HIDDEN) && !this._hasFlag(flags, AnnotationFlag.INVISIBLE);
  }
  mustBeViewed(annotationStorage, _renderForms) {
    const noView = annotationStorage?.get(this.data.id)?.noView;
    if (noView !== undefined) {
      return !noView;
    }
    return this.viewable && !this._hasFlag(this.flags, AnnotationFlag.HIDDEN);
  }
  mustBePrinted(annotationStorage) {
    const noPrint = annotationStorage?.get(this.data.id)?.noPrint;
    if (noPrint !== undefined) {
      return !noPrint;
    }
    return this.printable;
  }
  mustBeViewedWhenEditing(isEditing, modifiedIds = null) {
    return isEditing ? !this.data.isEditable : !modifiedIds?.has(this.data.id);
  }
  get viewable() {
    if (this.data.quadPoints === null) {
      return false;
    }
    if (this.flags === 0) {
      return true;
    }
    return this._isViewable(this.flags);
  }
  get printable() {
    if (this.data.quadPoints === null) {
      return false;
    }
    if (this.flags === 0) {
      return false;
    }
    return this._isPrintable(this.flags);
  }
  _parseStringHelper(data) {
    const str = typeof data === "string" ? stringToPDFString(data) : "";
    const dir = str && bidi(str).dir === "rtl" ? "rtl" : "ltr";
    return {
      str,
      dir
    };
  }
  setDefaultAppearance(params) {
    const {
      dict,
      annotationGlobals
    } = params;
    const defaultAppearance = getInheritableProperty({
      dict,
      key: "DA"
    }) || annotationGlobals.acroForm.get("DA");
    this._defaultAppearance = typeof defaultAppearance === "string" ? defaultAppearance : "";
    this.data.defaultAppearanceData = parseDefaultAppearance(this._defaultAppearance);
  }
  setTitle(title) {
    this._title = this._parseStringHelper(title);
  }
  setContents(contents) {
    this._contents = this._parseStringHelper(contents);
  }
  setModificationDate(modificationDate) {
    this.modificationDate = typeof modificationDate === "string" ? modificationDate : null;
  }
  setFlags(flags) {
    this.flags = Number.isInteger(flags) && flags > 0 ? flags : 0;
    if (this.flags & AnnotationFlag.INVISIBLE && this.constructor.name !== "Annotation") {
      this.flags ^= AnnotationFlag.INVISIBLE;
    }
  }
  hasFlag(flag) {
    return this._hasFlag(this.flags, flag);
  }
  setRectangle(rectangle) {
    this.rectangle = lookupNormalRect(rectangle, [0, 0, 0, 0]);
  }
  setColor(color) {
    this.color = getRgbColor(color);
  }
  setLineEndings(lineEndings) {
    this.lineEndings = ["None", "None"];
    if (Array.isArray(lineEndings) && lineEndings.length === 2) {
      for (let i = 0; i < 2; i++) {
        const obj = lineEndings[i];
        if (obj instanceof Name) {
          switch (obj.name) {
            case "None":
              continue;
            case "Square":
            case "Circle":
            case "Diamond":
            case "OpenArrow":
            case "ClosedArrow":
            case "Butt":
            case "ROpenArrow":
            case "RClosedArrow":
            case "Slash":
              this.lineEndings[i] = obj.name;
              continue;
          }
        }
        warn(`Ignoring invalid lineEnding: ${obj}`);
      }
    }
  }
  setRotation(mk, dict) {
    this.rotation = 0;
    let angle = mk instanceof Dict ? mk.get("R") || 0 : dict.get("Rotate") || 0;
    if (Number.isInteger(angle) && angle !== 0) {
      angle %= 360;
      if (angle < 0) {
        angle += 360;
      }
      if (angle % 90 === 0) {
        this.rotation = angle;
      }
    }
  }
  setBorderAndBackgroundColors(mk) {
    if (mk instanceof Dict) {
      this.borderColor = getRgbColor(mk.getArray("BC"), null);
      this.backgroundColor = getRgbColor(mk.getArray("BG"), null);
    } else {
      this.borderColor = this.backgroundColor = null;
    }
  }
  setBorderStyle(borderStyle) {
    this.borderStyle = new AnnotationBorderStyle();
    if (!(borderStyle instanceof Dict)) {
      return;
    }
    if (borderStyle.has("BS")) {
      const dict = borderStyle.get("BS");
      if (dict instanceof Dict) {
        const dictType = dict.get("Type");
        if (!dictType || isName(dictType, "Border")) {
          this.borderStyle.setWidth(dict.get("W"), this.rectangle);
          this.borderStyle.setStyle(dict.get("S"));
          this.borderStyle.setDashArray(dict.getArray("D"));
        }
      }
    } else if (borderStyle.has("Border")) {
      const array = borderStyle.getArray("Border");
      if (Array.isArray(array) && array.length >= 3) {
        this.borderStyle.setHorizontalCornerRadius(array[0]);
        this.borderStyle.setVerticalCornerRadius(array[1]);
        this.borderStyle.setWidth(array[2], this.rectangle);
        if (array.length === 4) {
          this.borderStyle.setDashArray(array[3], true);
        }
      }
    } else {
      this.borderStyle.setWidth(0);
    }
  }
  setAppearance(dict) {
    this.appearance = null;
    const appearanceStates = dict.get("AP");
    if (!(appearanceStates instanceof Dict)) {
      return;
    }
    const normalAppearanceState = appearanceStates.get("N");
    if (normalAppearanceState instanceof BaseStream) {
      this.appearance = normalAppearanceState;
      return;
    }
    if (!(normalAppearanceState instanceof Dict)) {
      return;
    }
    const as = dict.get("AS");
    if (!(as instanceof Name) || !normalAppearanceState.has(as.name)) {
      return;
    }
    const appearance = normalAppearanceState.get(as.name);
    if (appearance instanceof BaseStream) {
      this.appearance = appearance;
    }
  }
  setOptionalContent(dict) {
    this.oc = null;
    const oc = dict.get("OC");
    if (oc instanceof Name) {
      warn("setOptionalContent: Support for /Name-entry is not implemented.");
    } else if (oc instanceof Dict) {
      this.oc = oc;
    }
  }
  async loadResources(keys, appearance) {
    const resources = await appearance.dict.getAsync("Resources");
    if (resources) {
      await ObjectLoader.load(resources, keys, resources.xref);
    }
    return resources;
  }
  async getOperatorList(evaluator, task, intent, annotationStorage) {
    const {
      hasOwnCanvas,
      id,
      rect
    } = this.data;
    let appearance = this.appearance;
    const isUsingOwnCanvas = !!(hasOwnCanvas && intent & RenderingIntentFlag.DISPLAY);
    if (isUsingOwnCanvas && (this.width === 0 || this.height === 0)) {
      this.data.hasOwnCanvas = false;
      return {
        opList: new OperatorList(),
        separateForm: false,
        separateCanvas: false
      };
    }
    if (!appearance) {
      if (!isUsingOwnCanvas) {
        return {
          opList: new OperatorList(),
          separateForm: false,
          separateCanvas: false
        };
      }
      appearance = new StringStream("");
      appearance.dict = new Dict();
    }
    const appearanceDict = appearance.dict;
    const resources = await this.loadResources(RESOURCES_KEYS_OPERATOR_LIST, appearance);
    const bbox = lookupRect(appearanceDict.getArray("BBox"), [0, 0, 1, 1]);
    const matrix = lookupMatrix(appearanceDict.getArray("Matrix"), IDENTITY_MATRIX);
    const transform = getTransformMatrix(rect, bbox, matrix);
    const opList = new OperatorList();
    let optionalContent;
    if (this.oc) {
      optionalContent = await evaluator.parseMarkedContentProps(this.oc, null);
    }
    if (optionalContent !== undefined) {
      opList.addOp(OPS.beginMarkedContentProps, ["OC", optionalContent]);
    }
    opList.addOp(OPS.beginAnnotation, [id, rect, transform, matrix, isUsingOwnCanvas]);
    await evaluator.getOperatorList({
      stream: appearance,
      task,
      resources,
      operatorList: opList,
      fallbackFontDict: this._fallbackFontDict
    });
    opList.addOp(OPS.endAnnotation, []);
    if (optionalContent !== undefined) {
      opList.addOp(OPS.endMarkedContent, []);
    }
    this.reset();
    return {
      opList,
      separateForm: false,
      separateCanvas: isUsingOwnCanvas
    };
  }
  async save(evaluator, task, annotationStorage, changes) {
    return null;
  }
  get hasTextContent() {
    return false;
  }
  async extractTextContent(evaluator, task, viewBox) {
    if (!this.appearance) {
      return;
    }
    const resources = await this.loadResources(RESOURCES_KEYS_TEXT_CONTENT, this.appearance);
    const text = [];
    const buffer = [];
    let firstPosition = null;
    const sink = {
      desiredSize: Math.Infinity,
      ready: true,
      enqueue(chunk, size) {
        for (const item of chunk.items) {
          if (item.str === undefined) {
            continue;
          }
          firstPosition ||= item.transform.slice(-2);
          buffer.push(item.str);
          if (item.hasEOL) {
            text.push(buffer.join("").trimEnd());
            buffer.length = 0;
          }
        }
      }
    };
    await evaluator.getTextContent({
      stream: this.appearance,
      task,
      resources,
      includeMarkedContent: true,
      keepWhiteSpace: true,
      sink,
      viewBox
    });
    this.reset();
    if (buffer.length) {
      text.push(buffer.join("").trimEnd());
    }
    if (text.length > 1 || text[0]) {
      const appearanceDict = this.appearance.dict;
      const bbox = lookupRect(appearanceDict.getArray("BBox"), null);
      const matrix = lookupMatrix(appearanceDict.getArray("Matrix"), null);
      this.data.textPosition = this._transformPoint(firstPosition, bbox, matrix);
      this.data.textContent = text;
    }
  }
  _transformPoint(coords, bbox, matrix) {
    const {
      rect
    } = this.data;
    bbox ||= [0, 0, 1, 1];
    matrix ||= [1, 0, 0, 1, 0, 0];
    const transform = getTransformMatrix(rect, bbox, matrix);
    transform[4] -= rect[0];
    transform[5] -= rect[1];
    const p = coords.slice();
    Util.applyTransform(p, transform);
    Util.applyTransform(p, matrix);
    return p;
  }
  getFieldObject() {
    if (this.data.kidIds) {
      return {
        id: this.data.id,
        actions: this.data.actions,
        name: this.data.fieldName,
        strokeColor: this.data.borderColor,
        fillColor: this.data.backgroundColor,
        type: "",
        kidIds: this.data.kidIds,
        page: this.data.pageIndex,
        rotation: this.rotation
      };
    }
    return null;
  }
  reset() {
    for (const stream of this._streams) {
      stream.reset();
    }
  }
  _constructFieldName(dict) {
    if (!dict.has("T") && !dict.has("Parent")) {
      warn("Unknown field name, falling back to empty field name.");
      return "";
    }
    if (!dict.has("Parent")) {
      return stringToPDFString(dict.get("T"));
    }
    const fieldName = [];
    if (dict.has("T")) {
      fieldName.unshift(stringToPDFString(dict.get("T")));
    }
    let loopDict = dict;
    const visited = new RefSet();
    if (dict.objId) {
      visited.put(dict.objId);
    }
    while (loopDict.has("Parent")) {
      loopDict = loopDict.get("Parent");
      if (!(loopDict instanceof Dict) || loopDict.objId && visited.has(loopDict.objId)) {
        break;
      }
      if (loopDict.objId) {
        visited.put(loopDict.objId);
      }
      if (loopDict.has("T")) {
        fieldName.unshift(stringToPDFString(loopDict.get("T")));
      }
    }
    return fieldName.join(".");
  }
  get width() {
    return this.data.rect[2] - this.data.rect[0];
  }
  get height() {
    return this.data.rect[3] - this.data.rect[1];
  }
}
class AnnotationBorderStyle {
  constructor() {
    this.width = 1;
    this.rawWidth = 1;
    this.style = AnnotationBorderStyleType.SOLID;
    this.dashArray = [3];
    this.horizontalCornerRadius = 0;
    this.verticalCornerRadius = 0;
  }
  setWidth(width, rect = [0, 0, 0, 0]) {
    if (width instanceof Name) {
      this.width = 0;
      return;
    }
    if (typeof width === "number") {
      if (width > 0) {
        this.rawWidth = width;
        const maxWidth = (rect[2] - rect[0]) / 2;
        const maxHeight = (rect[3] - rect[1]) / 2;
        if (maxWidth > 0 && maxHeight > 0 && (width > maxWidth || width > maxHeight)) {
          warn(`AnnotationBorderStyle.setWidth - ignoring width: ${width}`);
          width = 1;
        }
      }
      this.width = width;
    }
  }
  setStyle(style) {
    if (!(style instanceof Name)) {
      return;
    }
    switch (style.name) {
      case "S":
        this.style = AnnotationBorderStyleType.SOLID;
        break;
      case "D":
        this.style = AnnotationBorderStyleType.DASHED;
        break;
      case "B":
        this.style = AnnotationBorderStyleType.BEVELED;
        break;
      case "I":
        this.style = AnnotationBorderStyleType.INSET;
        break;
      case "U":
        this.style = AnnotationBorderStyleType.UNDERLINE;
        break;
      default:
        break;
    }
  }
  setDashArray(dashArray, forceStyle = false) {
    if (Array.isArray(dashArray)) {
      let isValid = true;
      let allZeros = true;
      for (const element of dashArray) {
        const validNumber = +element >= 0;
        if (!validNumber) {
          isValid = false;
          break;
        } else if (element > 0) {
          allZeros = false;
        }
      }
      if (dashArray.length === 0 || isValid && !allZeros) {
        this.dashArray = dashArray;
        if (forceStyle) {
          this.setStyle(Name.get("D"));
        }
      } else {
        this.width = 0;
      }
    } else if (dashArray) {
      this.width = 0;
    }
  }
  setHorizontalCornerRadius(radius) {
    if (Number.isInteger(radius)) {
      this.horizontalCornerRadius = radius;
    }
  }
  setVerticalCornerRadius(radius) {
    if (Number.isInteger(radius)) {
      this.verticalCornerRadius = radius;
    }
  }
}
class MarkupAnnotation extends Annotation {
  constructor(params) {
    super(params);
    const {
      dict
    } = params;
    if (dict.has("IRT")) {
      const rawIRT = dict.getRaw("IRT");
      this.data.inReplyTo = rawIRT instanceof Ref ? rawIRT.toString() : null;
      const rt = dict.get("RT");
      this.data.replyType = rt instanceof Name ? rt.name : AnnotationReplyType.REPLY;
    }
    let popupRef = null;
    if (this.data.replyType === AnnotationReplyType.GROUP) {
      const parent = dict.get("IRT");
      this.setTitle(parent.get("T"));
      this.data.titleObj = this._title;
      this.setContents(parent.get("Contents"));
      this.data.contentsObj = this._contents;
      if (!parent.has("CreationDate")) {
        this.data.creationDate = null;
      } else {
        this.setCreationDate(parent.get("CreationDate"));
        this.data.creationDate = this.creationDate;
      }
      if (!parent.has("M")) {
        this.data.modificationDate = null;
      } else {
        this.setModificationDate(parent.get("M"));
        this.data.modificationDate = this.modificationDate;
      }
      popupRef = parent.getRaw("Popup");
      if (!parent.has("C")) {
        this.data.color = null;
      } else {
        this.setColor(parent.getArray("C"));
        this.data.color = this.color;
      }
    } else {
      this.data.titleObj = this._title;
      this.setCreationDate(dict.get("CreationDate"));
      this.data.creationDate = this.creationDate;
      popupRef = dict.getRaw("Popup");
      if (!dict.has("C")) {
        this.data.color = null;
      }
    }
    this.data.popupRef = popupRef instanceof Ref ? popupRef.toString() : null;
    if (dict.has("RC")) {
      this.data.richText = XFAFactory.getRichTextAsHtml(dict.get("RC"));
    }
  }
  setCreationDate(creationDate) {
    this.creationDate = typeof creationDate === "string" ? creationDate : null;
  }
  _setDefaultAppearance({
    xref,
    extra,
    strokeColor,
    fillColor,
    blendMode,
    strokeAlpha,
    fillAlpha,
    pointsCallback
  }) {
    const bbox = this.data.rect = [Infinity, Infinity, -Infinity, -Infinity];
    const buffer = ["q"];
    if (extra) {
      buffer.push(extra);
    }
    if (strokeColor) {
      buffer.push(`${strokeColor[0]} ${strokeColor[1]} ${strokeColor[2]} RG`);
    }
    if (fillColor) {
      buffer.push(`${fillColor[0]} ${fillColor[1]} ${fillColor[2]} rg`);
    }
    const pointsArray = this.data.quadPoints || Float32Array.from([this.rectangle[0], this.rectangle[3], this.rectangle[2], this.rectangle[3], this.rectangle[0], this.rectangle[1], this.rectangle[2], this.rectangle[1]]);
    for (let i = 0, ii = pointsArray.length; i < ii; i += 8) {
      const points = pointsCallback(buffer, pointsArray.subarray(i, i + 8));
      Util.rectBoundingBox(...points, bbox);
    }
    buffer.push("Q");
    const formDict = new Dict(xref);
    const appearanceStreamDict = new Dict(xref);
    appearanceStreamDict.set("Subtype", Name.get("Form"));
    const appearanceStream = new StringStream(buffer.join(" "));
    appearanceStream.dict = appearanceStreamDict;
    formDict.set("Fm0", appearanceStream);
    const gsDict = new Dict(xref);
    if (blendMode) {
      gsDict.set("BM", Name.get(blendMode));
    }
    if (typeof strokeAlpha === "number") {
      gsDict.set("CA", strokeAlpha);
    }
    if (typeof fillAlpha === "number") {
      gsDict.set("ca", fillAlpha);
    }
    const stateDict = new Dict(xref);
    stateDict.set("GS0", gsDict);
    const resources = new Dict(xref);
    resources.set("ExtGState", stateDict);
    resources.set("XObject", formDict);
    const appearanceDict = new Dict(xref);
    appearanceDict.set("Resources", resources);
    appearanceDict.set("BBox", bbox);
    this.appearance = new StringStream("/GS0 gs /Fm0 Do");
    this.appearance.dict = appearanceDict;
    this._streams.push(this.appearance, appearanceStream);
  }
  static async createNewAnnotation(xref, annotation, changes, params) {
    const annotationRef = annotation.ref ||= xref.getNewTemporaryRef();
    const ap = await this.createNewAppearanceStream(annotation, xref, params);
    let annotationDict;
    if (ap) {
      const apRef = xref.getNewTemporaryRef();
      annotationDict = this.createNewDict(annotation, xref, {
        apRef
      });
      changes.put(apRef, {
        data: ap
      });
    } else {
      annotationDict = this.createNewDict(annotation, xref, {});
    }
    if (Number.isInteger(annotation.parentTreeId)) {
      annotationDict.set("StructParent", annotation.parentTreeId);
    }
    changes.put(annotationRef, {
      data: annotationDict
    });
    return {
      ref: annotationRef
    };
  }
  static async createNewPrintAnnotation(annotationGlobals, xref, annotation, params) {
    const ap = await this.createNewAppearanceStream(annotation, xref, params);
    const annotationDict = this.createNewDict(annotation, xref, ap ? {
      ap
    } : {});
    const newAnnotation = new this.prototype.constructor({
      dict: annotationDict,
      xref,
      annotationGlobals,
      evaluatorOptions: params.evaluatorOptions
    });
    if (annotation.ref) {
      newAnnotation.ref = newAnnotation.refToReplace = annotation.ref;
    }
    return newAnnotation;
  }
}
class WidgetAnnotation extends Annotation {
  constructor(params) {
    super(params);
    const {
      dict,
      xref,
      annotationGlobals
    } = params;
    const data = this.data;
    this._needAppearances = params.needAppearances;
    data.annotationType = AnnotationType.WIDGET;
    if (data.fieldName === undefined) {
      data.fieldName = this._constructFieldName(dict);
    }
    if (data.actions === undefined) {
      data.actions = collectActions(xref, dict, AnnotationActionEventType);
    }
    let fieldValue = getInheritableProperty({
      dict,
      key: "V",
      getArray: true
    });
    data.fieldValue = this._decodeFormValue(fieldValue);
    const defaultFieldValue = getInheritableProperty({
      dict,
      key: "DV",
      getArray: true
    });
    data.defaultFieldValue = this._decodeFormValue(defaultFieldValue);
    if (fieldValue === undefined && annotationGlobals.xfaDatasets) {
      const path = this._title.str;
      if (path) {
        this._hasValueFromXFA = true;
        data.fieldValue = fieldValue = annotationGlobals.xfaDatasets.getValue(path);
      }
    }
    if (fieldValue === undefined && data.defaultFieldValue !== null) {
      data.fieldValue = data.defaultFieldValue;
    }
    data.alternativeText = stringToPDFString(dict.get("TU") || "");
    this.setDefaultAppearance(params);
    data.hasAppearance ||= this._needAppearances && data.fieldValue !== undefined && data.fieldValue !== null;
    const fieldType = getInheritableProperty({
      dict,
      key: "FT"
    });
    data.fieldType = fieldType instanceof Name ? fieldType.name : null;
    const localResources = getInheritableProperty({
      dict,
      key: "DR"
    });
    const acroFormResources = annotationGlobals.acroForm.get("DR");
    const appearanceResources = this.appearance?.dict.get("Resources");
    this._fieldResources = {
      localResources,
      acroFormResources,
      appearanceResources,
      mergedResources: Dict.merge({
        xref,
        dictArray: [localResources, appearanceResources, acroFormResources],
        mergeSubDicts: true
      })
    };
    data.fieldFlags = getInheritableProperty({
      dict,
      key: "Ff"
    });
    if (!Number.isInteger(data.fieldFlags) || data.fieldFlags < 0) {
      data.fieldFlags = 0;
    }
    data.password = this.hasFieldFlag(AnnotationFieldFlag.PASSWORD);
    data.readOnly = this.hasFieldFlag(AnnotationFieldFlag.READONLY);
    data.required = this.hasFieldFlag(AnnotationFieldFlag.REQUIRED);
    data.hidden = this._hasFlag(data.annotationFlags, AnnotationFlag.HIDDEN) || this._hasFlag(data.annotationFlags, AnnotationFlag.NOVIEW);
  }
  _decodeFormValue(formValue) {
    if (Array.isArray(formValue)) {
      return formValue.filter(item => typeof item === "string").map(item => stringToPDFString(item));
    } else if (formValue instanceof Name) {
      return stringToPDFString(formValue.name);
    } else if (typeof formValue === "string") {
      return stringToPDFString(formValue);
    }
    return null;
  }
  hasFieldFlag(flag) {
    return !!(this.data.fieldFlags & flag);
  }
  _isViewable(flags) {
    return true;
  }
  mustBeViewed(annotationStorage, renderForms) {
    if (renderForms) {
      return this.viewable;
    }
    return super.mustBeViewed(annotationStorage, renderForms) && !this._hasFlag(this.flags, AnnotationFlag.NOVIEW);
  }
  getRotationMatrix(annotationStorage) {
    let rotation = annotationStorage?.get(this.data.id)?.rotation;
    if (rotation === undefined) {
      rotation = this.rotation;
    }
    return rotation === 0 ? IDENTITY_MATRIX : getRotationMatrix(rotation, this.width, this.height);
  }
  getBorderAndBackgroundAppearances(annotationStorage) {
    let rotation = annotationStorage?.get(this.data.id)?.rotation;
    if (rotation === undefined) {
      rotation = this.rotation;
    }
    if (!this.backgroundColor && !this.borderColor) {
      return "";
    }
    const rect = rotation === 0 || rotation === 180 ? `0 0 ${this.width} ${this.height} re` : `0 0 ${this.height} ${this.width} re`;
    let str = "";
    if (this.backgroundColor) {
      str = `${getPdfColor(this.backgroundColor, true)} ${rect} f `;
    }
    if (this.borderColor) {
      const borderWidth = this.borderStyle.width || 1;
      str += `${borderWidth} w ${getPdfColor(this.borderColor, false)} ${rect} S `;
    }
    return str;
  }
  async getOperatorList(evaluator, task, intent, annotationStorage) {
    if (intent & RenderingIntentFlag.ANNOTATIONS_FORMS && !(this instanceof SignatureWidgetAnnotation) && !this.data.noHTML && !this.data.hasOwnCanvas) {
      return {
        opList: new OperatorList(),
        separateForm: true,
        separateCanvas: false
      };
    }
    if (!this._hasText) {
      return super.getOperatorList(evaluator, task, intent, annotationStorage);
    }
    const content = await this._getAppearance(evaluator, task, intent, annotationStorage);
    if (this.appearance && content === null) {
      return super.getOperatorList(evaluator, task, intent, annotationStorage);
    }
    const opList = new OperatorList();
    if (!this._defaultAppearance || content === null) {
      return {
        opList,
        separateForm: false,
        separateCanvas: false
      };
    }
    const isUsingOwnCanvas = !!(this.data.hasOwnCanvas && intent & RenderingIntentFlag.DISPLAY);
    const matrix = [1, 0, 0, 1, 0, 0];
    const bbox = [0, 0, this.width, this.height];
    const transform = getTransformMatrix(this.data.rect, bbox, matrix);
    let optionalContent;
    if (this.oc) {
      optionalContent = await evaluator.parseMarkedContentProps(this.oc, null);
    }
    if (optionalContent !== undefined) {
      opList.addOp(OPS.beginMarkedContentProps, ["OC", optionalContent]);
    }
    opList.addOp(OPS.beginAnnotation, [this.data.id, this.data.rect, transform, this.getRotationMatrix(annotationStorage), isUsingOwnCanvas]);
    const stream = new StringStream(content);
    await evaluator.getOperatorList({
      stream,
      task,
      resources: this._fieldResources.mergedResources,
      operatorList: opList
    });
    opList.addOp(OPS.endAnnotation, []);
    if (optionalContent !== undefined) {
      opList.addOp(OPS.endMarkedContent, []);
    }
    return {
      opList,
      separateForm: false,
      separateCanvas: isUsingOwnCanvas
    };
  }
  _getMKDict(rotation) {
    const mk = new Dict(null);
    if (rotation) {
      mk.set("R", rotation);
    }
    if (this.borderColor) {
      mk.set("BC", getPdfColorArray(this.borderColor));
    }
    if (this.backgroundColor) {
      mk.set("BG", getPdfColorArray(this.backgroundColor));
    }
    return mk.size > 0 ? mk : null;
  }
  amendSavedDict(annotationStorage, dict) {}
  setValue(dict, value, xref, changes) {
    const {
      dict: parentDict,
      ref: parentRef
    } = getParentToUpdate(dict, this.ref, xref);
    if (!parentDict) {
      dict.set("V", value);
    } else if (!changes.has(parentRef)) {
      const newParentDict = parentDict.clone();
      newParentDict.set("V", value);
      changes.put(parentRef, {
        data: newParentDict
      });
      return newParentDict;
    }
    return null;
  }
  async save(evaluator, task, annotationStorage, changes) {
    const storageEntry = annotationStorage?.get(this.data.id);
    const flags = this._buildFlags(storageEntry?.noView, storageEntry?.noPrint);
    let value = storageEntry?.value,
      rotation = storageEntry?.rotation;
    if (value === this.data.fieldValue || value === undefined) {
      if (!this._hasValueFromXFA && rotation === undefined && flags === undefined) {
        return;
      }
      value ||= this.data.fieldValue;
    }
    if (rotation === undefined && !this._hasValueFromXFA && Array.isArray(value) && Array.isArray(this.data.fieldValue) && isArrayEqual(value, this.data.fieldValue) && flags === undefined) {
      return;
    }
    if (rotation === undefined) {
      rotation = this.rotation;
    }
    let appearance = null;
    if (!this._needAppearances) {
      appearance = await this._getAppearance(evaluator, task, RenderingIntentFlag.SAVE, annotationStorage);
      if (appearance === null && flags === undefined) {
        return;
      }
    } else {}
    let needAppearances = false;
    if (appearance?.needAppearances) {
      needAppearances = true;
      appearance = null;
    }
    const {
      xref
    } = evaluator;
    const originalDict = xref.fetchIfRef(this.ref);
    if (!(originalDict instanceof Dict)) {
      return;
    }
    const dict = new Dict(xref);
    for (const key of originalDict.getKeys()) {
      if (key !== "AP") {
        dict.set(key, originalDict.getRaw(key));
      }
    }
    if (flags !== undefined) {
      dict.set("F", flags);
      if (appearance === null && !needAppearances) {
        const ap = originalDict.getRaw("AP");
        if (ap) {
          dict.set("AP", ap);
        }
      }
    }
    const xfa = {
      path: this.data.fieldName,
      value
    };
    const newParentDict = this.setValue(dict, Array.isArray(value) ? value.map(stringToAsciiOrUTF16BE) : stringToAsciiOrUTF16BE(value), xref, changes);
    this.amendSavedDict(annotationStorage, newParentDict || dict);
    const maybeMK = this._getMKDict(rotation);
    if (maybeMK) {
      dict.set("MK", maybeMK);
    }
    changes.put(this.ref, {
      data: dict,
      xfa,
      needAppearances
    });
    if (appearance !== null) {
      const newRef = xref.getNewTemporaryRef();
      const AP = new Dict(xref);
      dict.set("AP", AP);
      AP.set("N", newRef);
      const resources = this._getSaveFieldResources(xref);
      const appearanceStream = new StringStream(appearance);
      const appearanceDict = appearanceStream.dict = new Dict(xref);
      appearanceDict.set("Subtype", Name.get("Form"));
      appearanceDict.set("Resources", resources);
      const bbox = rotation % 180 === 0 ? [0, 0, this.width, this.height] : [0, 0, this.height, this.width];
      appearanceDict.set("BBox", bbox);
      const rotationMatrix = this.getRotationMatrix(annotationStorage);
      if (rotationMatrix !== IDENTITY_MATRIX) {
        appearanceDict.set("Matrix", rotationMatrix);
      }
      changes.put(newRef, {
        data: appearanceStream,
        xfa: null,
        needAppearances: false
      });
    }
    dict.set("M", `D:${getModificationDate()}`);
  }
  async _getAppearance(evaluator, task, intent, annotationStorage) {
    if (this.data.password) {
      return null;
    }
    const storageEntry = annotationStorage?.get(this.data.id);
    let value, rotation;
    if (storageEntry) {
      value = storageEntry.formattedValue || storageEntry.value;
      rotation = storageEntry.rotation;
    }
    if (rotation === undefined && value === undefined && !this._needAppearances) {
      if (!this._hasValueFromXFA || this.appearance) {
        return null;
      }
    }
    const colors = this.getBorderAndBackgroundAppearances(annotationStorage);
    if (value === undefined) {
      value = this.data.fieldValue;
      if (!value) {
        return `/Tx BMC q ${colors}Q EMC`;
      }
    }
    if (Array.isArray(value) && value.length === 1) {
      value = value[0];
    }
    assert(typeof value === "string", "Expected `value` to be a string.");
    value = value.trimEnd();
    if (this.data.combo) {
      const option = this.data.options.find(({
        exportValue
      }) => value === exportValue);
      value = option?.displayValue || value;
    }
    if (value === "") {
      return `/Tx BMC q ${colors}Q EMC`;
    }
    if (rotation === undefined) {
      rotation = this.rotation;
    }
    let lineCount = -1;
    let lines;
    if (this.data.multiLine) {
      lines = value.split(/\r\n?|\n/).map(line => line.normalize("NFC"));
      lineCount = lines.length;
    } else {
      lines = [value.replace(/\r\n?|\n/, "").normalize("NFC")];
    }
    const defaultPadding = 1;
    const defaultHPadding = 2;
    let {
      width: totalWidth,
      height: totalHeight
    } = this;
    if (rotation === 90 || rotation === 270) {
      [totalWidth, totalHeight] = [totalHeight, totalWidth];
    }
    if (!this._defaultAppearance) {
      this.data.defaultAppearanceData = parseDefaultAppearance(this._defaultAppearance = "/Helvetica 0 Tf 0 g");
    }
    let font = await WidgetAnnotation._getFontData(evaluator, task, this.data.defaultAppearanceData, this._fieldResources.mergedResources);
    let defaultAppearance, fontSize, lineHeight;
    const encodedLines = [];
    let encodingError = false;
    for (const line of lines) {
      const encodedString = font.encodeString(line);
      if (encodedString.length > 1) {
        encodingError = true;
      }
      encodedLines.push(encodedString.join(""));
    }
    if (encodingError && intent & RenderingIntentFlag.SAVE) {
      return {
        needAppearances: true
      };
    }
    if (encodingError && this._isOffscreenCanvasSupported) {
      const fontFamily = this.data.comb ? "monospace" : "sans-serif";
      const fakeUnicodeFont = new FakeUnicodeFont(evaluator.xref, fontFamily);
      const resources = fakeUnicodeFont.createFontResources(lines.join(""));
      const newFont = resources.getRaw("Font");
      if (this._fieldResources.mergedResources.has("Font")) {
        const oldFont = this._fieldResources.mergedResources.get("Font");
        for (const key of newFont.getKeys()) {
          oldFont.set(key, newFont.getRaw(key));
        }
      } else {
        this._fieldResources.mergedResources.set("Font", newFont);
      }
      const fontName = fakeUnicodeFont.fontName.name;
      font = await WidgetAnnotation._getFontData(evaluator, task, {
        fontName,
        fontSize: 0
      }, resources);
      for (let i = 0, ii = encodedLines.length; i < ii; i++) {
        encodedLines[i] = stringToUTF16String(lines[i]);
      }
      const savedDefaultAppearance = Object.assign(Object.create(null), this.data.defaultAppearanceData);
      this.data.defaultAppearanceData.fontSize = 0;
      this.data.defaultAppearanceData.fontName = fontName;
      [defaultAppearance, fontSize, lineHeight] = this._computeFontSize(totalHeight - 2 * defaultPadding, totalWidth - 2 * defaultHPadding, value, font, lineCount);
      this.data.defaultAppearanceData = savedDefaultAppearance;
    } else {
      if (!this._isOffscreenCanvasSupported) {
        warn("_getAppearance: OffscreenCanvas is not supported, annotation may not render correctly.");
      }
      [defaultAppearance, fontSize, lineHeight] = this._computeFontSize(totalHeight - 2 * defaultPadding, totalWidth - 2 * defaultHPadding, value, font, lineCount);
    }
    let descent = font.descent;
    if (isNaN(descent)) {
      descent = BASELINE_FACTOR * lineHeight;
    } else {
      descent = Math.max(BASELINE_FACTOR * lineHeight, Math.abs(descent) * fontSize);
    }
    const defaultVPadding = Math.min(Math.floor((totalHeight - fontSize) / 2), defaultPadding);
    const alignment = this.data.textAlignment;
    if (this.data.multiLine) {
      return this._getMultilineAppearance(defaultAppearance, encodedLines, font, fontSize, totalWidth, totalHeight, alignment, defaultHPadding, defaultVPadding, descent, lineHeight, annotationStorage);
    }
    if (this.data.comb) {
      return this._getCombAppearance(defaultAppearance, font, encodedLines[0], fontSize, totalWidth, totalHeight, defaultHPadding, defaultVPadding, descent, lineHeight, annotationStorage);
    }
    const bottomPadding = defaultVPadding + descent;
    if (alignment === 0 || alignment > 2) {
      return `/Tx BMC q ${colors}BT ` + defaultAppearance + ` 1 0 0 1 ${numberToString(defaultHPadding)} ${numberToString(bottomPadding)} Tm (${escapeString(encodedLines[0])}) Tj` + " ET Q EMC";
    }
    const prevInfo = {
      shift: 0
    };
    const renderedText = this._renderText(encodedLines[0], font, fontSize, totalWidth, alignment, prevInfo, defaultHPadding, bottomPadding);
    return `/Tx BMC q ${colors}BT ` + defaultAppearance + ` 1 0 0 1 0 0 Tm ${renderedText}` + " ET Q EMC";
  }
  static async _getFontData(evaluator, task, appearanceData, resources) {
    const operatorList = new OperatorList();
    const initialState = {
      font: null,
      clone() {
        return this;
      }
    };
    const {
      fontName,
      fontSize
    } = appearanceData;
    await evaluator.handleSetFont(resources, [fontName && Name.get(fontName), fontSize], null, operatorList, task, initialState, null);
    return initialState.font;
  }
  _getTextWidth(text, font) {
    return Math.sumPrecise(font.charsToGlyphs(text).map(g => g.width)) / 1000;
  }
  _computeFontSize(height, width, text, font, lineCount) {
    let {
      fontSize
    } = this.data.defaultAppearanceData;
    let lineHeight = (fontSize || 12) * LINE_FACTOR,
      numberOfLines = Math.round(height / lineHeight);
    if (!fontSize) {
      const roundWithTwoDigits = x => Math.floor(x * 100) / 100;
      if (lineCount === -1) {
        const textWidth = this._getTextWidth(text, font);
        fontSize = roundWithTwoDigits(Math.min(height / LINE_FACTOR, width / textWidth));
        numberOfLines = 1;
      } else {
        const lines = text.split(/\r\n?|\n/);
        const cachedLines = [];
        for (const line of lines) {
          const encoded = font.encodeString(line).join("");
          const glyphs = font.charsToGlyphs(encoded);
          const positions = font.getCharPositions(encoded);
          cachedLines.push({
            line: encoded,
            glyphs,
            positions
          });
        }
        const isTooBig = fsize => {
          let totalHeight = 0;
          for (const cache of cachedLines) {
            const chunks = this._splitLine(null, font, fsize, width, cache);
            totalHeight += chunks.length * fsize;
            if (totalHeight > height) {
              return true;
            }
          }
          return false;
        };
        numberOfLines = Math.max(numberOfLines, lineCount);
        while (true) {
          lineHeight = height / numberOfLines;
          fontSize = roundWithTwoDigits(lineHeight / LINE_FACTOR);
          if (isTooBig(fontSize)) {
            numberOfLines++;
            continue;
          }
          break;
        }
      }
      const {
        fontName,
        fontColor
      } = this.data.defaultAppearanceData;
      this._defaultAppearance = createDefaultAppearance({
        fontSize,
        fontName,
        fontColor
      });
    }
    return [this._defaultAppearance, fontSize, height / numberOfLines];
  }
  _renderText(text, font, fontSize, totalWidth, alignment, prevInfo, hPadding, vPadding) {
    let shift;
    if (alignment === 1) {
      const width = this._getTextWidth(text, font) * fontSize;
      shift = (totalWidth - width) / 2;
    } else if (alignment === 2) {
      const width = this._getTextWidth(text, font) * fontSize;
      shift = totalWidth - width - hPadding;
    } else {
      shift = hPadding;
    }
    const shiftStr = numberToString(shift - prevInfo.shift);
    prevInfo.shift = shift;
    vPadding = numberToString(vPadding);
    return `${shiftStr} ${vPadding} Td (${escapeString(text)}) Tj`;
  }
  _getSaveFieldResources(xref) {
    const {
      localResources,
      appearanceResources,
      acroFormResources
    } = this._fieldResources;
    const fontName = this.data.defaultAppearanceData?.fontName;
    if (!fontName) {
      return localResources || Dict.empty;
    }
    for (const resources of [localResources, appearanceResources]) {
      if (resources instanceof Dict) {
        const localFont = resources.get("Font");
        if (localFont instanceof Dict && localFont.has(fontName)) {
          return resources;
        }
      }
    }
    if (acroFormResources instanceof Dict) {
      const acroFormFont = acroFormResources.get("Font");
      if (acroFormFont instanceof Dict && acroFormFont.has(fontName)) {
        const subFontDict = new Dict(xref);
        subFontDict.set(fontName, acroFormFont.getRaw(fontName));
        const subResourcesDict = new Dict(xref);
        subResourcesDict.set("Font", subFontDict);
        return Dict.merge({
          xref,
          dictArray: [subResourcesDict, localResources],
          mergeSubDicts: true
        });
      }
    }
    return localResources || Dict.empty;
  }
  getFieldObject() {
    return null;
  }
}
class TextWidgetAnnotation extends WidgetAnnotation {
  constructor(params) {
    super(params);
    const {
      dict
    } = params;
    if (dict.has("PMD")) {
      this.flags |= AnnotationFlag.HIDDEN;
      this.data.hidden = true;
      warn("Barcodes are not supported");
    }
    this.data.hasOwnCanvas = this.data.readOnly && !this.data.noHTML;
    this._hasText = true;
    if (typeof this.data.fieldValue !== "string") {
      this.data.fieldValue = "";
    }
    let alignment = getInheritableProperty({
      dict,
      key: "Q"
    });
    if (!Number.isInteger(alignment) || alignment < 0 || alignment > 2) {
      alignment = null;
    }
    this.data.textAlignment = alignment;
    let maximumLength = getInheritableProperty({
      dict,
      key: "MaxLen"
    });
    if (!Number.isInteger(maximumLength) || maximumLength < 0) {
      maximumLength = 0;
    }
    this.data.maxLen = maximumLength;
    this.data.multiLine = this.hasFieldFlag(AnnotationFieldFlag.MULTILINE);
    this.data.comb = this.hasFieldFlag(AnnotationFieldFlag.COMB) && !this.data.multiLine && !this.data.password && !this.hasFieldFlag(AnnotationFieldFlag.FILESELECT) && this.data.maxLen !== 0;
    this.data.doNotScroll = this.hasFieldFlag(AnnotationFieldFlag.DONOTSCROLL);
  }
  get hasTextContent() {
    return !!this.appearance && !this._needAppearances;
  }
  _getCombAppearance(defaultAppearance, font, text, fontSize, width, height, hPadding, vPadding, descent, lineHeight, annotationStorage) {
    const combWidth = width / this.data.maxLen;
    const colors = this.getBorderAndBackgroundAppearances(annotationStorage);
    const buf = [];
    const positions = font.getCharPositions(text);
    for (const [start, end] of positions) {
      buf.push(`(${escapeString(text.substring(start, end))}) Tj`);
    }
    const renderedComb = buf.join(` ${numberToString(combWidth)} 0 Td `);
    return `/Tx BMC q ${colors}BT ` + defaultAppearance + ` 1 0 0 1 ${numberToString(hPadding)} ${numberToString(vPadding + descent)} Tm ${renderedComb}` + " ET Q EMC";
  }
  _getMultilineAppearance(defaultAppearance, lines, font, fontSize, width, height, alignment, hPadding, vPadding, descent, lineHeight, annotationStorage) {
    const buf = [];
    const totalWidth = width - 2 * hPadding;
    const prevInfo = {
      shift: 0
    };
    for (let i = 0, ii = lines.length; i < ii; i++) {
      const line = lines[i];
      const chunks = this._splitLine(line, font, fontSize, totalWidth);
      for (let j = 0, jj = chunks.length; j < jj; j++) {
        const chunk = chunks[j];
        const vShift = i === 0 && j === 0 ? -vPadding - (lineHeight - descent) : -lineHeight;
        buf.push(this._renderText(chunk, font, fontSize, width, alignment, prevInfo, hPadding, vShift));
      }
    }
    const colors = this.getBorderAndBackgroundAppearances(annotationStorage);
    const renderedText = buf.join("\n");
    return `/Tx BMC q ${colors}BT ` + defaultAppearance + ` 1 0 0 1 0 ${numberToString(height)} Tm ${renderedText}` + " ET Q EMC";
  }
  _splitLine(line, font, fontSize, width, cache = {}) {
    line = cache.line || line;
    const glyphs = cache.glyphs || font.charsToGlyphs(line);
    if (glyphs.length <= 1) {
      return [line];
    }
    const positions = cache.positions || font.getCharPositions(line);
    const scale = fontSize / 1000;
    const chunks = [];
    let lastSpacePosInStringStart = -1,
      lastSpacePosInStringEnd = -1,
      lastSpacePos = -1,
      startChunk = 0,
      currentWidth = 0;
    for (let i = 0, ii = glyphs.length; i < ii; i++) {
      const [start, end] = positions[i];
      const glyph = glyphs[i];
      const glyphWidth = glyph.width * scale;
      if (glyph.unicode === " ") {
        if (currentWidth + glyphWidth > width) {
          chunks.push(line.substring(startChunk, start));
          startChunk = start;
          currentWidth = glyphWidth;
          lastSpacePosInStringStart = -1;
          lastSpacePos = -1;
        } else {
          currentWidth += glyphWidth;
          lastSpacePosInStringStart = start;
          lastSpacePosInStringEnd = end;
          lastSpacePos = i;
        }
      } else if (currentWidth + glyphWidth > width) {
        if (lastSpacePosInStringStart !== -1) {
          chunks.push(line.substring(startChunk, lastSpacePosInStringEnd));
          startChunk = lastSpacePosInStringEnd;
          i = lastSpacePos + 1;
          lastSpacePosInStringStart = -1;
          currentWidth = 0;
        } else {
          chunks.push(line.substring(startChunk, start));
          startChunk = start;
          currentWidth = glyphWidth;
        }
      } else {
        currentWidth += glyphWidth;
      }
    }
    if (startChunk < line.length) {
      chunks.push(line.substring(startChunk, line.length));
    }
    return chunks;
  }
  async extractTextContent(evaluator, task, viewBox) {
    await super.extractTextContent(evaluator, task, viewBox);
    const text = this.data.textContent;
    if (!text) {
      return;
    }
    const allText = text.join("\n");
    if (allText === this.data.fieldValue) {
      return;
    }
    const regex = allText.replaceAll(/([.*+?^${}()|[\]\\])|(\s+)/g, (_m, p1) => p1 ? `\\${p1}` : "\\s+");
    if (new RegExp(`^\\s*${regex}\\s*$`).test(this.data.fieldValue)) {
      this.data.textContent = this.data.fieldValue.split("\n");
    }
  }
  getFieldObject() {
    return {
      id: this.data.id,
      value: this.data.fieldValue,
      defaultValue: this.data.defaultFieldValue || "",
      multiline: this.data.multiLine,
      password: this.data.password,
      charLimit: this.data.maxLen,
      comb: this.data.comb,
      editable: !this.data.readOnly,
      hidden: this.data.hidden,
      name: this.data.fieldName,
      rect: this.data.rect,
      actions: this.data.actions,
      page: this.data.pageIndex,
      strokeColor: this.data.borderColor,
      fillColor: this.data.backgroundColor,
      rotation: this.rotation,
      type: "text"
    };
  }
}
class ButtonWidgetAnnotation extends WidgetAnnotation {
  constructor(params) {
    super(params);
    this.checkedAppearance = null;
    this.uncheckedAppearance = null;
    const isRadio = this.hasFieldFlag(AnnotationFieldFlag.RADIO),
      isPushButton = this.hasFieldFlag(AnnotationFieldFlag.PUSHBUTTON);
    this.data.checkBox = !isRadio && !isPushButton;
    this.data.radioButton = isRadio && !isPushButton;
    this.data.pushButton = isPushButton;
    this.data.isTooltipOnly = false;
    if (this.data.checkBox) {
      this._processCheckBox(params);
    } else if (this.data.radioButton) {
      this._processRadioButton(params);
    } else if (this.data.pushButton) {
      this.data.hasOwnCanvas = true;
      this.data.noHTML = false;
      this._processPushButton(params);
    } else {
      warn("Invalid field flags for button widget annotation");
    }
  }
  async getOperatorList(evaluator, task, intent, annotationStorage) {
    if (this.data.pushButton) {
      return super.getOperatorList(evaluator, task, intent, false, annotationStorage);
    }
    let value = null;
    let rotation = null;
    if (annotationStorage) {
      const storageEntry = annotationStorage.get(this.data.id);
      value = storageEntry ? storageEntry.value : null;
      rotation = storageEntry ? storageEntry.rotation : null;
    }
    if (value === null && this.appearance) {
      return super.getOperatorList(evaluator, task, intent, annotationStorage);
    }
    if (value === null || value === undefined) {
      value = this.data.checkBox ? this.data.fieldValue === this.data.exportValue : this.data.fieldValue === this.data.buttonValue;
    }
    const appearance = value ? this.checkedAppearance : this.uncheckedAppearance;
    if (appearance) {
      const savedAppearance = this.appearance;
      const savedMatrix = lookupMatrix(appearance.dict.getArray("Matrix"), IDENTITY_MATRIX);
      if (rotation) {
        appearance.dict.set("Matrix", this.getRotationMatrix(annotationStorage));
      }
      this.appearance = appearance;
      const operatorList = super.getOperatorList(evaluator, task, intent, annotationStorage);
      this.appearance = savedAppearance;
      appearance.dict.set("Matrix", savedMatrix);
      return operatorList;
    }
    return {
      opList: new OperatorList(),
      separateForm: false,
      separateCanvas: false
    };
  }
  async save(evaluator, task, annotationStorage, changes) {
    if (this.data.checkBox) {
      this._saveCheckbox(evaluator, task, annotationStorage, changes);
      return;
    }
    if (this.data.radioButton) {
      this._saveRadioButton(evaluator, task, annotationStorage, changes);
    }
  }
  async _saveCheckbox(evaluator, task, annotationStorage, changes) {
    if (!annotationStorage) {
      return;
    }
    const storageEntry = annotationStorage.get(this.data.id);
    const flags = this._buildFlags(storageEntry?.noView, storageEntry?.noPrint);
    let rotation = storageEntry?.rotation,
      value = storageEntry?.value;
    if (rotation === undefined && flags === undefined) {
      if (value === undefined) {
        return;
      }
      const defaultValue = this.data.fieldValue === this.data.exportValue;
      if (defaultValue === value) {
        return;
      }
    }
    let dict = evaluator.xref.fetchIfRef(this.ref);
    if (!(dict instanceof Dict)) {
      return;
    }
    dict = dict.clone();
    if (rotation === undefined) {
      rotation = this.rotation;
    }
    if (value === undefined) {
      value = this.data.fieldValue === this.data.exportValue;
    }
    const xfa = {
      path: this.data.fieldName,
      value: value ? this.data.exportValue : ""
    };
    const name = Name.get(value ? this.data.exportValue : "Off");
    this.setValue(dict, name, evaluator.xref, changes);
    dict.set("AS", name);
    dict.set("M", `D:${getModificationDate()}`);
    if (flags !== undefined) {
      dict.set("F", flags);
    }
    const maybeMK = this._getMKDict(rotation);
    if (maybeMK) {
      dict.set("MK", maybeMK);
    }
    changes.put(this.ref, {
      data: dict,
      xfa,
      needAppearances: false
    });
  }
  async _saveRadioButton(evaluator, task, annotationStorage, changes) {
    if (!annotationStorage) {
      return;
    }
    const storageEntry = annotationStorage.get(this.data.id);
    const flags = this._buildFlags(storageEntry?.noView, storageEntry?.noPrint);
    let rotation = storageEntry?.rotation,
      value = storageEntry?.value;
    if (rotation === undefined && flags === undefined) {
      if (value === undefined) {
        return;
      }
      const defaultValue = this.data.fieldValue === this.data.buttonValue;
      if (defaultValue === value) {
        return;
      }
    }
    let dict = evaluator.xref.fetchIfRef(this.ref);
    if (!(dict instanceof Dict)) {
      return;
    }
    dict = dict.clone();
    if (value === undefined) {
      value = this.data.fieldValue === this.data.buttonValue;
    }
    if (rotation === undefined) {
      rotation = this.rotation;
    }
    const xfa = {
      path: this.data.fieldName,
      value: value ? this.data.buttonValue : ""
    };
    const name = Name.get(value ? this.data.buttonValue : "Off");
    if (value) {
      this.setValue(dict, name, evaluator.xref, changes);
    }
    dict.set("AS", name);
    dict.set("M", `D:${getModificationDate()}`);
    if (flags !== undefined) {
      dict.set("F", flags);
    }
    const maybeMK = this._getMKDict(rotation);
    if (maybeMK) {
      dict.set("MK", maybeMK);
    }
    changes.put(this.ref, {
      data: dict,
      xfa,
      needAppearances: false
    });
  }
  _getDefaultCheckedAppearance(params, type) {
    const {
      width,
      height
    } = this;
    const bbox = [0, 0, width, height];
    const FONT_RATIO = 0.8;
    const fontSize = Math.min(width, height) * FONT_RATIO;
    let metrics, char;
    if (type === "check") {
      metrics = {
        width: 0.755 * fontSize,
        height: 0.705 * fontSize
      };
      char = "\x33";
    } else if (type === "disc") {
      metrics = {
        width: 0.791 * fontSize,
        height: 0.705 * fontSize
      };
      char = "\x6C";
    } else {
      unreachable(`_getDefaultCheckedAppearance - unsupported type: ${type}`);
    }
    const xShift = numberToString((width - metrics.width) / 2);
    const yShift = numberToString((height - metrics.height) / 2);
    const appearance = `q BT /PdfJsZaDb ${fontSize} Tf 0 g ${xShift} ${yShift} Td (${char}) Tj ET Q`;
    const appearanceStreamDict = new Dict(params.xref);
    appearanceStreamDict.set("FormType", 1);
    appearanceStreamDict.set("Subtype", Name.get("Form"));
    appearanceStreamDict.set("Type", Name.get("XObject"));
    appearanceStreamDict.set("BBox", bbox);
    appearanceStreamDict.set("Matrix", [1, 0, 0, 1, 0, 0]);
    appearanceStreamDict.set("Length", appearance.length);
    const resources = new Dict(params.xref);
    const font = new Dict(params.xref);
    font.set("PdfJsZaDb", this.fallbackFontDict);
    resources.set("Font", font);
    appearanceStreamDict.set("Resources", resources);
    this.checkedAppearance = new StringStream(appearance);
    this.checkedAppearance.dict = appearanceStreamDict;
    this._streams.push(this.checkedAppearance);
  }
  _processCheckBox(params) {
    const customAppearance = params.dict.get("AP");
    if (!(customAppearance instanceof Dict)) {
      return;
    }
    const normalAppearance = customAppearance.get("N");
    if (!(normalAppearance instanceof Dict)) {
      return;
    }
    const asValue = this._decodeFormValue(params.dict.get("AS"));
    if (typeof asValue === "string") {
      this.data.fieldValue = asValue;
    }
    const yes = this.data.fieldValue !== null && this.data.fieldValue !== "Off" ? this.data.fieldValue : "Yes";
    const exportValues = this._decodeFormValue(normalAppearance.getKeys());
    if (exportValues.length === 0) {
      exportValues.push("Off", yes);
    } else if (exportValues.length === 1) {
      if (exportValues[0] === "Off") {
        exportValues.push(yes);
      } else {
        exportValues.unshift("Off");
      }
    } else if (exportValues.includes(yes)) {
      exportValues.length = 0;
      exportValues.push("Off", yes);
    } else {
      const otherYes = exportValues.find(v => v !== "Off");
      exportValues.length = 0;
      exportValues.push("Off", otherYes);
    }
    if (!exportValues.includes(this.data.fieldValue)) {
      this.data.fieldValue = "Off";
    }
    this.data.exportValue = exportValues[1];
    const checkedAppearance = normalAppearance.get(this.data.exportValue);
    this.checkedAppearance = checkedAppearance instanceof BaseStream ? checkedAppearance : null;
    const uncheckedAppearance = normalAppearance.get("Off");
    this.uncheckedAppearance = uncheckedAppearance instanceof BaseStream ? uncheckedAppearance : null;
    if (this.checkedAppearance) {
      this._streams.push(this.checkedAppearance);
    } else {
      this._getDefaultCheckedAppearance(params, "check");
    }
    if (this.uncheckedAppearance) {
      this._streams.push(this.uncheckedAppearance);
    }
    this._fallbackFontDict = this.fallbackFontDict;
    if (this.data.defaultFieldValue === null) {
      this.data.defaultFieldValue = "Off";
    }
  }
  _processRadioButton(params) {
    this.data.buttonValue = null;
    const fieldParent = params.dict.get("Parent");
    if (fieldParent instanceof Dict) {
      this.parent = params.dict.getRaw("Parent");
      const fieldParentValue = fieldParent.get("V");
      if (fieldParentValue instanceof Name) {
        this.data.fieldValue = this._decodeFormValue(fieldParentValue);
      }
    }
    const appearanceStates = params.dict.get("AP");
    if (!(appearanceStates instanceof Dict)) {
      return;
    }
    const normalAppearance = appearanceStates.get("N");
    if (!(normalAppearance instanceof Dict)) {
      return;
    }
    for (const key of normalAppearance.getKeys()) {
      if (key !== "Off") {
        this.data.buttonValue = this._decodeFormValue(key);
        break;
      }
    }
    const checkedAppearance = normalAppearance.get(this.data.buttonValue);
    this.checkedAppearance = checkedAppearance instanceof BaseStream ? checkedAppearance : null;
    const uncheckedAppearance = normalAppearance.get("Off");
    this.uncheckedAppearance = uncheckedAppearance instanceof BaseStream ? uncheckedAppearance : null;
    if (this.checkedAppearance) {
      this._streams.push(this.checkedAppearance);
    } else {
      this._getDefaultCheckedAppearance(params, "disc");
    }
    if (this.uncheckedAppearance) {
      this._streams.push(this.uncheckedAppearance);
    }
    this._fallbackFontDict = this.fallbackFontDict;
    if (this.data.defaultFieldValue === null) {
      this.data.defaultFieldValue = "Off";
    }
  }
  _processPushButton(params) {
    const {
      dict,
      annotationGlobals
    } = params;
    if (!dict.has("A") && !dict.has("AA") && !this.data.alternativeText) {
      warn("Push buttons without action dictionaries are not supported");
      return;
    }
    this.data.isTooltipOnly = !dict.has("A") && !dict.has("AA");
    Catalog.parseDestDictionary({
      destDict: dict,
      resultObj: this.data,
      docBaseUrl: annotationGlobals.baseUrl,
      docAttachments: annotationGlobals.attachments
    });
  }
  getFieldObject() {
    let type = "button";
    let exportValues;
    if (this.data.checkBox) {
      type = "checkbox";
      exportValues = this.data.exportValue;
    } else if (this.data.radioButton) {
      type = "radiobutton";
      exportValues = this.data.buttonValue;
    }
    return {
      id: this.data.id,
      value: this.data.fieldValue || "Off",
      defaultValue: this.data.defaultFieldValue,
      exportValues,
      editable: !this.data.readOnly,
      name: this.data.fieldName,
      rect: this.data.rect,
      hidden: this.data.hidden,
      actions: this.data.actions,
      page: this.data.pageIndex,
      strokeColor: this.data.borderColor,
      fillColor: this.data.backgroundColor,
      rotation: this.rotation,
      type
    };
  }
  get fallbackFontDict() {
    const dict = new Dict();
    dict.set("BaseFont", Name.get("ZapfDingbats"));
    dict.set("Type", Name.get("FallbackType"));
    dict.set("Subtype", Name.get("FallbackType"));
    dict.set("Encoding", Name.get("ZapfDingbatsEncoding"));
    return shadow(this, "fallbackFontDict", dict);
  }
}
class ChoiceWidgetAnnotation extends WidgetAnnotation {
  constructor(params) {
    super(params);
    const {
      dict,
      xref
    } = params;
    this.indices = dict.getArray("I");
    this.hasIndices = Array.isArray(this.indices) && this.indices.length > 0;
    this.data.options = [];
    const options = getInheritableProperty({
      dict,
      key: "Opt"
    });
    if (Array.isArray(options)) {
      for (let i = 0, ii = options.length; i < ii; i++) {
        const option = xref.fetchIfRef(options[i]);
        const isOptionArray = Array.isArray(option);
        this.data.options[i] = {
          exportValue: this._decodeFormValue(isOptionArray ? xref.fetchIfRef(option[0]) : option),
          displayValue: this._decodeFormValue(isOptionArray ? xref.fetchIfRef(option[1]) : option)
        };
      }
    }
    if (!this.hasIndices) {
      if (typeof this.data.fieldValue === "string") {
        this.data.fieldValue = [this.data.fieldValue];
      } else {
        this.data.fieldValue ||= [];
      }
    } else {
      this.data.fieldValue = [];
      const ii = this.data.options.length;
      for (const i of this.indices) {
        if (Number.isInteger(i) && i >= 0 && i < ii) {
          this.data.fieldValue.push(this.data.options[i].exportValue);
        }
      }
    }
    if (this.data.options.length === 0 && this.data.fieldValue.length > 0) {
      this.data.options = this.data.fieldValue.map(value => ({
        exportValue: value,
        displayValue: value
      }));
    }
    this.data.combo = this.hasFieldFlag(AnnotationFieldFlag.COMBO);
    this.data.multiSelect = this.hasFieldFlag(AnnotationFieldFlag.MULTISELECT);
    this._hasText = true;
  }
  getFieldObject() {
    const type = this.data.combo ? "combobox" : "listbox";
    const value = this.data.fieldValue.length > 0 ? this.data.fieldValue[0] : null;
    return {
      id: this.data.id,
      value,
      defaultValue: this.data.defaultFieldValue,
      editable: !this.data.readOnly,
      name: this.data.fieldName,
      rect: this.data.rect,
      numItems: this.data.fieldValue.length,
      multipleSelection: this.data.multiSelect,
      hidden: this.data.hidden,
      actions: this.data.actions,
      items: this.data.options,
      page: this.data.pageIndex,
      strokeColor: this.data.borderColor,
      fillColor: this.data.backgroundColor,
      rotation: this.rotation,
      type
    };
  }
  amendSavedDict(annotationStorage, dict) {
    if (!this.hasIndices) {
      return;
    }
    let values = annotationStorage?.get(this.data.id)?.value;
    if (!Array.isArray(values)) {
      values = [values];
    }
    const indices = [];
    const {
      options
    } = this.data;
    for (let i = 0, j = 0, ii = options.length; i < ii; i++) {
      if (options[i].exportValue === values[j]) {
        indices.push(i);
        j += 1;
      }
    }
    dict.set("I", indices);
  }
  async _getAppearance(evaluator, task, intent, annotationStorage) {
    if (this.data.combo) {
      return super._getAppearance(evaluator, task, intent, annotationStorage);
    }
    let exportedValue, rotation;
    const storageEntry = annotationStorage?.get(this.data.id);
    if (storageEntry) {
      rotation = storageEntry.rotation;
      exportedValue = storageEntry.value;
    }
    if (rotation === undefined && exportedValue === undefined && !this._needAppearances) {
      return null;
    }
    if (exportedValue === undefined) {
      exportedValue = this.data.fieldValue;
    } else if (!Array.isArray(exportedValue)) {
      exportedValue = [exportedValue];
    }
    const defaultPadding = 1;
    const defaultHPadding = 2;
    let {
      width: totalWidth,
      height: totalHeight
    } = this;
    if (rotation === 90 || rotation === 270) {
      [totalWidth, totalHeight] = [totalHeight, totalWidth];
    }
    const lineCount = this.data.options.length;
    const valueIndices = [];
    for (let i = 0; i < lineCount; i++) {
      const {
        exportValue
      } = this.data.options[i];
      if (exportedValue.includes(exportValue)) {
        valueIndices.push(i);
      }
    }
    if (!this._defaultAppearance) {
      this.data.defaultAppearanceData = parseDefaultAppearance(this._defaultAppearance = "/Helvetica 0 Tf 0 g");
    }
    const font = await WidgetAnnotation._getFontData(evaluator, task, this.data.defaultAppearanceData, this._fieldResources.mergedResources);
    let defaultAppearance;
    let {
      fontSize
    } = this.data.defaultAppearanceData;
    if (!fontSize) {
      const lineHeight = (totalHeight - defaultPadding) / lineCount;
      let lineWidth = -1;
      let value;
      for (const {
        displayValue
      } of this.data.options) {
        const width = this._getTextWidth(displayValue, font);
        if (width > lineWidth) {
          lineWidth = width;
          value = displayValue;
        }
      }
      [defaultAppearance, fontSize] = this._computeFontSize(lineHeight, totalWidth - 2 * defaultHPadding, value, font, -1);
    } else {
      defaultAppearance = this._defaultAppearance;
    }
    const lineHeight = fontSize * LINE_FACTOR;
    const vPadding = (lineHeight - fontSize) / 2;
    const numberOfVisibleLines = Math.floor(totalHeight / lineHeight);
    let firstIndex = 0;
    if (valueIndices.length > 0) {
      const minIndex = Math.min(...valueIndices);
      const maxIndex = Math.max(...valueIndices);
      firstIndex = Math.max(0, maxIndex - numberOfVisibleLines + 1);
      if (firstIndex > minIndex) {
        firstIndex = minIndex;
      }
    }
    const end = Math.min(firstIndex + numberOfVisibleLines + 1, lineCount);
    const buf = ["/Tx BMC q", `1 1 ${totalWidth} ${totalHeight} re W n`];
    if (valueIndices.length) {
      buf.push("0.600006 0.756866 0.854904 rg");
      for (const index of valueIndices) {
        if (firstIndex <= index && index < end) {
          buf.push(`1 ${totalHeight - (index - firstIndex + 1) * lineHeight} ${totalWidth} ${lineHeight} re f`);
        }
      }
    }
    buf.push("BT", defaultAppearance, `1 0 0 1 0 ${totalHeight} Tm`);
    const prevInfo = {
      shift: 0
    };
    for (let i = firstIndex; i < end; i++) {
      const {
        displayValue
      } = this.data.options[i];
      const vpadding = i === firstIndex ? vPadding : 0;
      buf.push(this._renderText(displayValue, font, fontSize, totalWidth, 0, prevInfo, defaultHPadding, -lineHeight + vpadding));
    }
    buf.push("ET Q EMC");
    return buf.join("\n");
  }
}
class SignatureWidgetAnnotation extends WidgetAnnotation {
  constructor(params) {
    super(params);
    this.data.fieldValue = null;
    this.data.hasOwnCanvas = this.data.noRotate;
    this.data.noHTML = !this.data.hasOwnCanvas;
  }
  getFieldObject() {
    return {
      id: this.data.id,
      value: null,
      page: this.data.pageIndex,
      type: "signature"
    };
  }
}
class TextAnnotation extends MarkupAnnotation {
  constructor(params) {
    const DEFAULT_ICON_SIZE = 22;
    super(params);
    this.data.noRotate = true;
    this.data.hasOwnCanvas = this.data.noRotate;
    this.data.noHTML = false;
    const {
      dict
    } = params;
    this.data.annotationType = AnnotationType.TEXT;
    if (this.data.hasAppearance) {
      this.data.name = "NoIcon";
    } else {
      this.data.rect[1] = this.data.rect[3] - DEFAULT_ICON_SIZE;
      this.data.rect[2] = this.data.rect[0] + DEFAULT_ICON_SIZE;
      this.data.name = dict.has("Name") ? dict.get("Name").name : "Note";
    }
    if (dict.has("State")) {
      this.data.state = dict.get("State") || null;
      this.data.stateModel = dict.get("StateModel") || null;
    } else {
      this.data.state = null;
      this.data.stateModel = null;
    }
  }
}
class LinkAnnotation extends Annotation {
  constructor(params) {
    super(params);
    const {
      dict,
      annotationGlobals
    } = params;
    this.data.annotationType = AnnotationType.LINK;
    this.data.noHTML = false;
    const quadPoints = getQuadPoints(dict, this.rectangle);
    if (quadPoints) {
      this.data.quadPoints = quadPoints;
    }
    this.data.borderColor ||= this.data.color;
    Catalog.parseDestDictionary({
      destDict: dict,
      resultObj: this.data,
      docBaseUrl: annotationGlobals.baseUrl,
      docAttachments: annotationGlobals.attachments
    });
  }
}
class PopupAnnotation extends Annotation {
  constructor(params) {
    super(params);
    const {
      dict
    } = params;
    this.data.annotationType = AnnotationType.POPUP;
    this.data.noHTML = false;
    if (this.width === 0 || this.height === 0) {
      this.data.rect = null;
    }
    let parentItem = dict.get("Parent");
    if (!parentItem) {
      warn("Popup annotation has a missing or invalid parent annotation.");
      return;
    }
    this.data.parentRect = lookupNormalRect(parentItem.getArray("Rect"), null);
    const rt = parentItem.get("RT");
    if (isName(rt, AnnotationReplyType.GROUP)) {
      parentItem = parentItem.get("IRT");
    }
    if (!parentItem.has("M")) {
      this.data.modificationDate = null;
    } else {
      this.setModificationDate(parentItem.get("M"));
      this.data.modificationDate = this.modificationDate;
    }
    if (!parentItem.has("C")) {
      this.data.color = null;
    } else {
      this.setColor(parentItem.getArray("C"));
      this.data.color = this.color;
    }
    if (!this.viewable) {
      const parentFlags = parentItem.get("F");
      if (this._isViewable(parentFlags)) {
        this.setFlags(parentFlags);
      }
    }
    this.setTitle(parentItem.get("T"));
    this.data.titleObj = this._title;
    this.setContents(parentItem.get("Contents"));
    this.data.contentsObj = this._contents;
    if (parentItem.has("RC")) {
      this.data.richText = XFAFactory.getRichTextAsHtml(parentItem.get("RC"));
    }
    this.data.open = !!dict.get("Open");
  }
}
class FreeTextAnnotation extends MarkupAnnotation {
  constructor(params) {
    super(params);
    this.data.hasOwnCanvas = this.data.noRotate;
    this.data.isEditable = !this.data.noHTML;
    this.data.noHTML = false;
    const {
      annotationGlobals,
      evaluatorOptions,
      xref
    } = params;
    this.data.annotationType = AnnotationType.FREETEXT;
    this.setDefaultAppearance(params);
    this._hasAppearance = !!this.appearance;
    if (this._hasAppearance) {
      const {
        fontColor,
        fontSize
      } = parseAppearanceStream(this.appearance, evaluatorOptions, xref, annotationGlobals.globalColorSpaceCache);
      this.data.defaultAppearanceData.fontColor = fontColor;
      this.data.defaultAppearanceData.fontSize = fontSize || 10;
    } else {
      this.data.defaultAppearanceData.fontSize ||= 10;
      const {
        fontColor,
        fontSize
      } = this.data.defaultAppearanceData;
      if (this._contents.str) {
        this.data.textContent = this._contents.str.split(/\r\n?|\n/).map(line => line.trimEnd());
        const {
          coords,
          bbox,
          matrix
        } = FakeUnicodeFont.getFirstPositionInfo(this.rectangle, this.rotation, fontSize);
        this.data.textPosition = this._transformPoint(coords, bbox, matrix);
      }
      if (this._isOffscreenCanvasSupported) {
        const strokeAlpha = params.dict.get("CA");
        const fakeUnicodeFont = new FakeUnicodeFont(xref, "sans-serif");
        this.appearance = fakeUnicodeFont.createAppearance(this._contents.str, this.rectangle, this.rotation, fontSize, fontColor, strokeAlpha);
        this._streams.push(this.appearance);
      } else {
        warn("FreeTextAnnotation: OffscreenCanvas is not supported, annotation may not render correctly.");
      }
    }
  }
  get hasTextContent() {
    return this._hasAppearance;
  }
  static createNewDict(annotation, xref, {
    apRef,
    ap
  }) {
    const {
      color,
      fontSize,
      oldAnnotation,
      rect,
      rotation,
      user,
      value
    } = annotation;
    const freetext = oldAnnotation || new Dict(xref);
    freetext.set("Type", Name.get("Annot"));
    freetext.set("Subtype", Name.get("FreeText"));
    if (oldAnnotation) {
      freetext.set("M", `D:${getModificationDate()}`);
      freetext.delete("RC");
    } else {
      freetext.set("CreationDate", `D:${getModificationDate()}`);
    }
    freetext.set("Rect", rect);
    const da = `/Helv ${fontSize} Tf ${getPdfColor(color, true)}`;
    freetext.set("DA", da);
    freetext.set("Contents", stringToAsciiOrUTF16BE(value));
    freetext.set("F", 4);
    freetext.set("Border", [0, 0, 0]);
    freetext.set("Rotate", rotation);
    if (user) {
      freetext.set("T", stringToAsciiOrUTF16BE(user));
    }
    if (apRef || ap) {
      const n = new Dict(xref);
      freetext.set("AP", n);
      if (apRef) {
        n.set("N", apRef);
      } else {
        n.set("N", ap);
      }
    }
    return freetext;
  }
  static async createNewAppearanceStream(annotation, xref, params) {
    const {
      baseFontRef,
      evaluator,
      task
    } = params;
    const {
      color,
      fontSize,
      rect,
      rotation,
      value
    } = annotation;
    const resources = new Dict(xref);
    const font = new Dict(xref);
    if (baseFontRef) {
      font.set("Helv", baseFontRef);
    } else {
      const baseFont = new Dict(xref);
      baseFont.set("BaseFont", Name.get("Helvetica"));
      baseFont.set("Type", Name.get("Font"));
      baseFont.set("Subtype", Name.get("Type1"));
      baseFont.set("Encoding", Name.get("WinAnsiEncoding"));
      font.set("Helv", baseFont);
    }
    resources.set("Font", font);
    const helv = await WidgetAnnotation._getFontData(evaluator, task, {
      fontName: "Helv",
      fontSize
    }, resources);
    const [x1, y1, x2, y2] = rect;
    let w = x2 - x1;
    let h = y2 - y1;
    if (rotation % 180 !== 0) {
      [w, h] = [h, w];
    }
    const lines = value.split("\n");
    const scale = fontSize / 1000;
    let totalWidth = -Infinity;
    const encodedLines = [];
    for (let line of lines) {
      const encoded = helv.encodeString(line);
      if (encoded.length > 1) {
        return null;
      }
      line = encoded.join("");
      encodedLines.push(line);
      let lineWidth = 0;
      const glyphs = helv.charsToGlyphs(line);
      for (const glyph of glyphs) {
        lineWidth += glyph.width * scale;
      }
      totalWidth = Math.max(totalWidth, lineWidth);
    }
    let hscale = 1;
    if (totalWidth > w) {
      hscale = w / totalWidth;
    }
    let vscale = 1;
    const lineHeight = LINE_FACTOR * fontSize;
    const lineAscent = (LINE_FACTOR - LINE_DESCENT_FACTOR) * fontSize;
    const totalHeight = lineHeight * lines.length;
    if (totalHeight > h) {
      vscale = h / totalHeight;
    }
    const fscale = Math.min(hscale, vscale);
    const newFontSize = fontSize * fscale;
    let firstPoint, clipBox, matrix;
    switch (rotation) {
      case 0:
        matrix = [1, 0, 0, 1];
        clipBox = [rect[0], rect[1], w, h];
        firstPoint = [rect[0], rect[3] - lineAscent];
        break;
      case 90:
        matrix = [0, 1, -1, 0];
        clipBox = [rect[1], -rect[2], w, h];
        firstPoint = [rect[1], -rect[0] - lineAscent];
        break;
      case 180:
        matrix = [-1, 0, 0, -1];
        clipBox = [-rect[2], -rect[3], w, h];
        firstPoint = [-rect[2], -rect[1] - lineAscent];
        break;
      case 270:
        matrix = [0, -1, 1, 0];
        clipBox = [-rect[3], rect[0], w, h];
        firstPoint = [-rect[3], rect[2] - lineAscent];
        break;
    }
    const buffer = ["q", `${matrix.join(" ")} 0 0 cm`, `${clipBox.join(" ")} re W n`, `BT`, `${getPdfColor(color, true)}`, `0 Tc /Helv ${numberToString(newFontSize)} Tf`];
    buffer.push(`${firstPoint.join(" ")} Td (${escapeString(encodedLines[0])}) Tj`);
    const vShift = numberToString(lineHeight);
    for (let i = 1, ii = encodedLines.length; i < ii; i++) {
      const line = encodedLines[i];
      buffer.push(`0 -${vShift} Td (${escapeString(line)}) Tj`);
    }
    buffer.push("ET", "Q");
    const appearance = buffer.join("\n");
    const appearanceStreamDict = new Dict(xref);
    appearanceStreamDict.set("FormType", 1);
    appearanceStreamDict.set("Subtype", Name.get("Form"));
    appearanceStreamDict.set("Type", Name.get("XObject"));
    appearanceStreamDict.set("BBox", rect);
    appearanceStreamDict.set("Resources", resources);
    appearanceStreamDict.set("Matrix", [1, 0, 0, 1, -rect[0], -rect[1]]);
    const ap = new StringStream(appearance);
    ap.dict = appearanceStreamDict;
    return ap;
  }
}
class LineAnnotation extends MarkupAnnotation {
  constructor(params) {
    super(params);
    const {
      dict,
      xref
    } = params;
    this.data.annotationType = AnnotationType.LINE;
    this.data.hasOwnCanvas = this.data.noRotate;
    this.data.noHTML = false;
    const lineCoordinates = lookupRect(dict.getArray("L"), [0, 0, 0, 0]);
    this.data.lineCoordinates = Util.normalizeRect(lineCoordinates);
    this.setLineEndings(dict.getArray("LE"));
    this.data.lineEndings = this.lineEndings;
    if (!this.appearance) {
      const strokeColor = this.color ? getPdfColorArray(this.color) : [0, 0, 0];
      const strokeAlpha = dict.get("CA");
      const interiorColor = getRgbColor(dict.getArray("IC"), null);
      const fillColor = interiorColor ? getPdfColorArray(interiorColor) : null;
      const fillAlpha = fillColor ? strokeAlpha : null;
      const borderWidth = this.borderStyle.width || 1,
        borderAdjust = 2 * borderWidth;
      const bbox = [this.data.lineCoordinates[0] - borderAdjust, this.data.lineCoordinates[1] - borderAdjust, this.data.lineCoordinates[2] + borderAdjust, this.data.lineCoordinates[3] + borderAdjust];
      if (!Util.intersect(this.rectangle, bbox)) {
        this.rectangle = bbox;
      }
      this._setDefaultAppearance({
        xref,
        extra: `${borderWidth} w`,
        strokeColor,
        fillColor,
        strokeAlpha,
        fillAlpha,
        pointsCallback: (buffer, points) => {
          buffer.push(`${lineCoordinates[0]} ${lineCoordinates[1]} m`, `${lineCoordinates[2]} ${lineCoordinates[3]} l`, "S");
          return [points[0] - borderWidth, points[7] - borderWidth, points[2] + borderWidth, points[3] + borderWidth];
        }
      });
    }
  }
}
class SquareAnnotation extends MarkupAnnotation {
  constructor(params) {
    super(params);
    const {
      dict,
      xref
    } = params;
    this.data.annotationType = AnnotationType.SQUARE;
    this.data.hasOwnCanvas = this.data.noRotate;
    this.data.noHTML = false;
    if (!this.appearance) {
      const strokeColor = this.color ? getPdfColorArray(this.color) : [0, 0, 0];
      const strokeAlpha = dict.get("CA");
      const interiorColor = getRgbColor(dict.getArray("IC"), null);
      const fillColor = interiorColor ? getPdfColorArray(interiorColor) : null;
      const fillAlpha = fillColor ? strokeAlpha : null;
      if (this.borderStyle.width === 0 && !fillColor) {
        return;
      }
      this._setDefaultAppearance({
        xref,
        extra: `${this.borderStyle.width} w`,
        strokeColor,
        fillColor,
        strokeAlpha,
        fillAlpha,
        pointsCallback: (buffer, points) => {
          const x = points[4] + this.borderStyle.width / 2;
          const y = points[5] + this.borderStyle.width / 2;
          const width = points[6] - points[4] - this.borderStyle.width;
          const height = points[3] - points[7] - this.borderStyle.width;
          buffer.push(`${x} ${y} ${width} ${height} re`);
          if (fillColor) {
            buffer.push("B");
          } else {
            buffer.push("S");
          }
          return [points[0], points[7], points[2], points[3]];
        }
      });
    }
  }
}
class CircleAnnotation extends MarkupAnnotation {
  constructor(params) {
    super(params);
    const {
      dict,
      xref
    } = params;
    this.data.annotationType = AnnotationType.CIRCLE;
    if (!this.appearance) {
      const strokeColor = this.color ? getPdfColorArray(this.color) : [0, 0, 0];
      const strokeAlpha = dict.get("CA");
      const interiorColor = getRgbColor(dict.getArray("IC"), null);
      const fillColor = interiorColor ? getPdfColorArray(interiorColor) : null;
      const fillAlpha = fillColor ? strokeAlpha : null;
      if (this.borderStyle.width === 0 && !fillColor) {
        return;
      }
      const controlPointsDistance = 4 / 3 * Math.tan(Math.PI / (2 * 4));
      this._setDefaultAppearance({
        xref,
        extra: `${this.borderStyle.width} w`,
        strokeColor,
        fillColor,
        strokeAlpha,
        fillAlpha,
        pointsCallback: (buffer, points) => {
          const x0 = points[0] + this.borderStyle.width / 2;
          const y0 = points[1] - this.borderStyle.width / 2;
          const x1 = points[6] - this.borderStyle.width / 2;
          const y1 = points[7] + this.borderStyle.width / 2;
          const xMid = x0 + (x1 - x0) / 2;
          const yMid = y0 + (y1 - y0) / 2;
          const xOffset = (x1 - x0) / 2 * controlPointsDistance;
          const yOffset = (y1 - y0) / 2 * controlPointsDistance;
          buffer.push(`${xMid} ${y1} m`, `${xMid + xOffset} ${y1} ${x1} ${yMid + yOffset} ${x1} ${yMid} c`, `${x1} ${yMid - yOffset} ${xMid + xOffset} ${y0} ${xMid} ${y0} c`, `${xMid - xOffset} ${y0} ${x0} ${yMid - yOffset} ${x0} ${yMid} c`, `${x0} ${yMid + yOffset} ${xMid - xOffset} ${y1} ${xMid} ${y1} c`, "h");
          if (fillColor) {
            buffer.push("B");
          } else {
            buffer.push("S");
          }
          return [points[0], points[7], points[2], points[3]];
        }
      });
    }
  }
}
class PolylineAnnotation extends MarkupAnnotation {
  constructor(params) {
    super(params);
    const {
      dict,
      xref
    } = params;
    this.data.annotationType = AnnotationType.POLYLINE;
    this.data.hasOwnCanvas = this.data.noRotate;
    this.data.noHTML = false;
    this.data.vertices = null;
    if (!(this instanceof PolygonAnnotation)) {
      this.setLineEndings(dict.getArray("LE"));
      this.data.lineEndings = this.lineEndings;
    }
    const rawVertices = dict.getArray("Vertices");
    if (!isNumberArray(rawVertices, null)) {
      return;
    }
    const vertices = this.data.vertices = Float32Array.from(rawVertices);
    if (!this.appearance) {
      const strokeColor = this.color ? getPdfColorArray(this.color) : [0, 0, 0];
      const strokeAlpha = dict.get("CA");
      const borderWidth = this.borderStyle.width || 1,
        borderAdjust = 2 * borderWidth;
      const bbox = [Infinity, Infinity, -Infinity, -Infinity];
      for (let i = 0, ii = vertices.length; i < ii; i += 2) {
        Util.rectBoundingBox(vertices[i] - borderAdjust, vertices[i + 1] - borderAdjust, vertices[i] + borderAdjust, vertices[i + 1] + borderAdjust, bbox);
      }
      if (!Util.intersect(this.rectangle, bbox)) {
        this.rectangle = bbox;
      }
      this._setDefaultAppearance({
        xref,
        extra: `${borderWidth} w`,
        strokeColor,
        strokeAlpha,
        pointsCallback: (buffer, points) => {
          for (let i = 0, ii = vertices.length; i < ii; i += 2) {
            buffer.push(`${vertices[i]} ${vertices[i + 1]} ${i === 0 ? "m" : "l"}`);
          }
          buffer.push("S");
          return [points[0], points[7], points[2], points[3]];
        }
      });
    }
  }
}
class PolygonAnnotation extends PolylineAnnotation {
  constructor(params) {
    super(params);
    this.data.annotationType = AnnotationType.POLYGON;
  }
}
class CaretAnnotation extends MarkupAnnotation {
  constructor(params) {
    super(params);
    this.data.annotationType = AnnotationType.CARET;
  }
}
class InkAnnotation extends MarkupAnnotation {
  constructor(params) {
    super(params);
    this.data.hasOwnCanvas = this.data.noRotate;
    this.data.noHTML = false;
    const {
      dict,
      xref
    } = params;
    this.data.annotationType = AnnotationType.INK;
    this.data.inkLists = [];
    this.data.isEditable = !this.data.noHTML;
    this.data.noHTML = false;
    this.data.opacity = dict.get("CA") || 1;
    const rawInkLists = dict.getArray("InkList");
    if (!Array.isArray(rawInkLists)) {
      return;
    }
    for (let i = 0, ii = rawInkLists.length; i < ii; ++i) {
      if (!Array.isArray(rawInkLists[i])) {
        continue;
      }
      const inkList = new Float32Array(rawInkLists[i].length);
      this.data.inkLists.push(inkList);
      for (let j = 0, jj = rawInkLists[i].length; j < jj; j += 2) {
        const x = xref.fetchIfRef(rawInkLists[i][j]),
          y = xref.fetchIfRef(rawInkLists[i][j + 1]);
        if (typeof x === "number" && typeof y === "number") {
          inkList[j] = x;
          inkList[j + 1] = y;
        }
      }
    }
    if (!this.appearance) {
      const strokeColor = this.color ? getPdfColorArray(this.color) : [0, 0, 0];
      const strokeAlpha = dict.get("CA");
      const borderWidth = this.borderStyle.width || 1,
        borderAdjust = 2 * borderWidth;
      const bbox = [Infinity, Infinity, -Infinity, -Infinity];
      for (const inkList of this.data.inkLists) {
        for (let i = 0, ii = inkList.length; i < ii; i += 2) {
          Util.rectBoundingBox(inkList[i] - borderAdjust, inkList[i + 1] - borderAdjust, inkList[i] + borderAdjust, inkList[i + 1] + borderAdjust, bbox);
        }
      }
      if (!Util.intersect(this.rectangle, bbox)) {
        this.rectangle = bbox;
      }
      this._setDefaultAppearance({
        xref,
        extra: `${borderWidth} w`,
        strokeColor,
        strokeAlpha,
        pointsCallback: (buffer, points) => {
          for (const inkList of this.data.inkLists) {
            for (let i = 0, ii = inkList.length; i < ii; i += 2) {
              buffer.push(`${inkList[i]} ${inkList[i + 1]} ${i === 0 ? "m" : "l"}`);
            }
            buffer.push("S");
          }
          return [points[0], points[7], points[2], points[3]];
        }
      });
    }
  }
  static createNewDict(annotation, xref, {
    apRef,
    ap
  }) {
    const {
      oldAnnotation,
      color,
      opacity,
      paths,
      outlines,
      rect,
      rotation,
      thickness,
      user
    } = annotation;
    const ink = oldAnnotation || new Dict(xref);
    ink.set("Type", Name.get("Annot"));
    ink.set("Subtype", Name.get("Ink"));
    ink.set(oldAnnotation ? "M" : "CreationDate", `D:${getModificationDate()}`);
    ink.set("Rect", rect);
    ink.set("InkList", outlines?.points || paths.points);
    ink.set("F", 4);
    ink.set("Rotate", rotation);
    if (user) {
      ink.set("T", stringToAsciiOrUTF16BE(user));
    }
    if (outlines) {
      ink.set("IT", Name.get("InkHighlight"));
    }
    const bs = new Dict(xref);
    ink.set("BS", bs);
    bs.set("W", thickness);
    ink.set("C", getPdfColorArray(color));
    ink.set("CA", opacity);
    const n = new Dict(xref);
    ink.set("AP", n);
    if (apRef) {
      n.set("N", apRef);
    } else {
      n.set("N", ap);
    }
    return ink;
  }
  static async createNewAppearanceStream(annotation, xref, params) {
    if (annotation.outlines) {
      return this.createNewAppearanceStreamForHighlight(annotation, xref, params);
    }
    const {
      color,
      rect,
      paths,
      thickness,
      opacity
    } = annotation;
    const appearanceBuffer = [`${thickness} w 1 J 1 j`, `${getPdfColor(color, false)}`];
    if (opacity !== 1) {
      appearanceBuffer.push("/R0 gs");
    }
    for (const outline of paths.lines) {
      appearanceBuffer.push(`${numberToString(outline[4])} ${numberToString(outline[5])} m`);
      for (let i = 6, ii = outline.length; i < ii; i += 6) {
        if (isNaN(outline[i])) {
          appearanceBuffer.push(`${numberToString(outline[i + 4])} ${numberToString(outline[i + 5])} l`);
        } else {
          const [c1x, c1y, c2x, c2y, x, y] = outline.slice(i, i + 6);
          appearanceBuffer.push([c1x, c1y, c2x, c2y, x, y].map(numberToString).join(" ") + " c");
        }
      }
      if (outline.length === 6) {
        appearanceBuffer.push(`${numberToString(outline[4])} ${numberToString(outline[5])} l`);
      }
    }
    appearanceBuffer.push("S");
    const appearance = appearanceBuffer.join("\n");
    const appearanceStreamDict = new Dict(xref);
    appearanceStreamDict.set("FormType", 1);
    appearanceStreamDict.set("Subtype", Name.get("Form"));
    appearanceStreamDict.set("Type", Name.get("XObject"));
    appearanceStreamDict.set("BBox", rect);
    appearanceStreamDict.set("Length", appearance.length);
    if (opacity !== 1) {
      const resources = new Dict(xref);
      const extGState = new Dict(xref);
      const r0 = new Dict(xref);
      r0.set("CA", opacity);
      r0.set("Type", Name.get("ExtGState"));
      extGState.set("R0", r0);
      resources.set("ExtGState", extGState);
      appearanceStreamDict.set("Resources", resources);
    }
    const ap = new StringStream(appearance);
    ap.dict = appearanceStreamDict;
    return ap;
  }
  static async createNewAppearanceStreamForHighlight(annotation, xref, params) {
    const {
      color,
      rect,
      outlines: {
        outline
      },
      opacity
    } = annotation;
    const appearanceBuffer = [`${getPdfColor(color, true)}`, "/R0 gs"];
    appearanceBuffer.push(`${numberToString(outline[4])} ${numberToString(outline[5])} m`);
    for (let i = 6, ii = outline.length; i < ii; i += 6) {
      if (isNaN(outline[i])) {
        appearanceBuffer.push(`${numberToString(outline[i + 4])} ${numberToString(outline[i + 5])} l`);
      } else {
        const [c1x, c1y, c2x, c2y, x, y] = outline.slice(i, i + 6);
        appearanceBuffer.push([c1x, c1y, c2x, c2y, x, y].map(numberToString).join(" ") + " c");
      }
    }
    appearanceBuffer.push("h f");
    const appearance = appearanceBuffer.join("\n");
    const appearanceStreamDict = new Dict(xref);
    appearanceStreamDict.set("FormType", 1);
    appearanceStreamDict.set("Subtype", Name.get("Form"));
    appearanceStreamDict.set("Type", Name.get("XObject"));
    appearanceStreamDict.set("BBox", rect);
    appearanceStreamDict.set("Length", appearance.length);
    const resources = new Dict(xref);
    const extGState = new Dict(xref);
    resources.set("ExtGState", extGState);
    appearanceStreamDict.set("Resources", resources);
    const r0 = new Dict(xref);
    extGState.set("R0", r0);
    r0.set("BM", Name.get("Multiply"));
    if (opacity !== 1) {
      r0.set("ca", opacity);
      r0.set("Type", Name.get("ExtGState"));
    }
    const ap = new StringStream(appearance);
    ap.dict = appearanceStreamDict;
    return ap;
  }
}
class HighlightAnnotation extends MarkupAnnotation {
  constructor(params) {
    super(params);
    const {
      dict,
      xref
    } = params;
    this.data.annotationType = AnnotationType.HIGHLIGHT;
    this.data.isEditable = !this.data.noHTML;
    this.data.noHTML = false;
    this.data.opacity = dict.get("CA") || 1;
    const quadPoints = this.data.quadPoints = getQuadPoints(dict, null);
    if (quadPoints) {
      const resources = this.appearance?.dict.get("Resources");
      if (!this.appearance || !resources?.has("ExtGState")) {
        if (this.appearance) {
          warn("HighlightAnnotation - ignoring built-in appearance stream.");
        }
        const fillColor = this.color ? getPdfColorArray(this.color) : [1, 1, 0];
        const fillAlpha = dict.get("CA");
        this._setDefaultAppearance({
          xref,
          fillColor,
          blendMode: "Multiply",
          fillAlpha,
          pointsCallback: (buffer, points) => {
            buffer.push(`${points[0]} ${points[1]} m`, `${points[2]} ${points[3]} l`, `${points[6]} ${points[7]} l`, `${points[4]} ${points[5]} l`, "f");
            return [points[0], points[7], points[2], points[3]];
          }
        });
      }
    } else {
      this.data.popupRef = null;
    }
  }
  static createNewDict(annotation, xref, {
    apRef,
    ap
  }) {
    const {
      color,
      oldAnnotation,
      opacity,
      rect,
      rotation,
      user,
      quadPoints
    } = annotation;
    const highlight = oldAnnotation || new Dict(xref);
    highlight.set("Type", Name.get("Annot"));
    highlight.set("Subtype", Name.get("Highlight"));
    highlight.set(oldAnnotation ? "M" : "CreationDate", `D:${getModificationDate()}`);
    highlight.set("CreationDate", `D:${getModificationDate()}`);
    highlight.set("Rect", rect);
    highlight.set("F", 4);
    highlight.set("Border", [0, 0, 0]);
    highlight.set("Rotate", rotation);
    highlight.set("QuadPoints", quadPoints);
    highlight.set("C", getPdfColorArray(color));
    highlight.set("CA", opacity);
    if (user) {
      highlight.set("T", stringToAsciiOrUTF16BE(user));
    }
    if (apRef || ap) {
      const n = new Dict(xref);
      highlight.set("AP", n);
      n.set("N", apRef || ap);
    }
    return highlight;
  }
  static async createNewAppearanceStream(annotation, xref, params) {
    const {
      color,
      rect,
      outlines,
      opacity
    } = annotation;
    const appearanceBuffer = [`${getPdfColor(color, true)}`, "/R0 gs"];
    const buffer = [];
    for (const outline of outlines) {
      buffer.length = 0;
      buffer.push(`${numberToString(outline[0])} ${numberToString(outline[1])} m`);
      for (let i = 2, ii = outline.length; i < ii; i += 2) {
        buffer.push(`${numberToString(outline[i])} ${numberToString(outline[i + 1])} l`);
      }
      buffer.push("h");
      appearanceBuffer.push(buffer.join("\n"));
    }
    appearanceBuffer.push("f*");
    const appearance = appearanceBuffer.join("\n");
    const appearanceStreamDict = new Dict(xref);
    appearanceStreamDict.set("FormType", 1);
    appearanceStreamDict.set("Subtype", Name.get("Form"));
    appearanceStreamDict.set("Type", Name.get("XObject"));
    appearanceStreamDict.set("BBox", rect);
    appearanceStreamDict.set("Length", appearance.length);
    const resources = new Dict(xref);
    const extGState = new Dict(xref);
    resources.set("ExtGState", extGState);
    appearanceStreamDict.set("Resources", resources);
    const r0 = new Dict(xref);
    extGState.set("R0", r0);
    r0.set("BM", Name.get("Multiply"));
    if (opacity !== 1) {
      r0.set("ca", opacity);
      r0.set("Type", Name.get("ExtGState"));
    }
    const ap = new StringStream(appearance);
    ap.dict = appearanceStreamDict;
    return ap;
  }
}
class UnderlineAnnotation extends MarkupAnnotation {
  constructor(params) {
    super(params);
    const {
      dict,
      xref
    } = params;
    this.data.annotationType = AnnotationType.UNDERLINE;
    const quadPoints = this.data.quadPoints = getQuadPoints(dict, null);
    if (quadPoints) {
      if (!this.appearance) {
        const strokeColor = this.color ? getPdfColorArray(this.color) : [0, 0, 0];
        const strokeAlpha = dict.get("CA");
        this._setDefaultAppearance({
          xref,
          extra: "[] 0 d 0.571 w",
          strokeColor,
          strokeAlpha,
          pointsCallback: (buffer, points) => {
            buffer.push(`${points[4]} ${points[5] + 1.3} m`, `${points[6]} ${points[7] + 1.3} l`, "S");
            return [points[0], points[7], points[2], points[3]];
          }
        });
      }
    } else {
      this.data.popupRef = null;
    }
  }
}
class SquigglyAnnotation extends MarkupAnnotation {
  constructor(params) {
    super(params);
    const {
      dict,
      xref
    } = params;
    this.data.annotationType = AnnotationType.SQUIGGLY;
    const quadPoints = this.data.quadPoints = getQuadPoints(dict, null);
    if (quadPoints) {
      if (!this.appearance) {
        const strokeColor = this.color ? getPdfColorArray(this.color) : [0, 0, 0];
        const strokeAlpha = dict.get("CA");
        this._setDefaultAppearance({
          xref,
          extra: "[] 0 d 1 w",
          strokeColor,
          strokeAlpha,
          pointsCallback: (buffer, points) => {
            const dy = (points[1] - points[5]) / 6;
            let shift = dy;
            let x = points[4];
            const y = points[5];
            const xEnd = points[6];
            buffer.push(`${x} ${y + shift} m`);
            do {
              x += 2;
              shift = shift === 0 ? dy : 0;
              buffer.push(`${x} ${y + shift} l`);
            } while (x < xEnd);
            buffer.push("S");
            return [points[4], y - 2 * dy, xEnd, y + 2 * dy];
          }
        });
      }
    } else {
      this.data.popupRef = null;
    }
  }
}
class StrikeOutAnnotation extends MarkupAnnotation {
  constructor(params) {
    super(params);
    const {
      dict,
      xref
    } = params;
    this.data.annotationType = AnnotationType.STRIKEOUT;
    const quadPoints = this.data.quadPoints = getQuadPoints(dict, null);
    if (quadPoints) {
      if (!this.appearance) {
        const strokeColor = this.color ? getPdfColorArray(this.color) : [0, 0, 0];
        const strokeAlpha = dict.get("CA");
        this._setDefaultAppearance({
          xref,
          extra: "[] 0 d 1 w",
          strokeColor,
          strokeAlpha,
          pointsCallback: (buffer, points) => {
            buffer.push(`${(points[0] + points[4]) / 2} ` + `${(points[1] + points[5]) / 2} m`, `${(points[2] + points[6]) / 2} ` + `${(points[3] + points[7]) / 2} l`, "S");
            return [points[0], points[7], points[2], points[3]];
          }
        });
      }
    } else {
      this.data.popupRef = null;
    }
  }
}
class StampAnnotation extends MarkupAnnotation {
  #savedHasOwnCanvas = null;
  constructor(params) {
    super(params);
    this.data.annotationType = AnnotationType.STAMP;
    this.data.hasOwnCanvas = this.data.noRotate;
    this.data.isEditable = !this.data.noHTML;
    this.data.noHTML = false;
  }
  mustBeViewedWhenEditing(isEditing, modifiedIds = null) {
    if (isEditing) {
      if (!this.data.isEditable) {
        return true;
      }
      this.#savedHasOwnCanvas ??= this.data.hasOwnCanvas;
      this.data.hasOwnCanvas = true;
      return true;
    }
    if (this.#savedHasOwnCanvas !== null) {
      this.data.hasOwnCanvas = this.#savedHasOwnCanvas;
      this.#savedHasOwnCanvas = null;
    }
    return !modifiedIds?.has(this.data.id);
  }
  static async createImage(bitmap, xref) {
    const {
      width,
      height
    } = bitmap;
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d", {
      alpha: true
    });
    ctx.drawImage(bitmap, 0, 0);
    const data = ctx.getImageData(0, 0, width, height).data;
    const buf32 = new Uint32Array(data.buffer);
    const hasAlpha = buf32.some(FeatureTest.isLittleEndian ? x => x >>> 24 !== 0xff : x => (x & 0xff) !== 0xff);
    if (hasAlpha) {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0);
    }
    const jpegBufferPromise = canvas.convertToBlob({
      type: "image/jpeg",
      quality: 1
    }).then(blob => blob.arrayBuffer());
    const xobjectName = Name.get("XObject");
    const imageName = Name.get("Image");
    const image = new Dict(xref);
    image.set("Type", xobjectName);
    image.set("Subtype", imageName);
    image.set("BitsPerComponent", 8);
    image.set("ColorSpace", Name.get("DeviceRGB"));
    image.set("Filter", Name.get("DCTDecode"));
    image.set("BBox", [0, 0, width, height]);
    image.set("Width", width);
    image.set("Height", height);
    let smaskStream = null;
    if (hasAlpha) {
      const alphaBuffer = new Uint8Array(buf32.length);
      if (FeatureTest.isLittleEndian) {
        for (let i = 0, ii = buf32.length; i < ii; i++) {
          alphaBuffer[i] = buf32[i] >>> 24;
        }
      } else {
        for (let i = 0, ii = buf32.length; i < ii; i++) {
          alphaBuffer[i] = buf32[i] & 0xff;
        }
      }
      const smask = new Dict(xref);
      smask.set("Type", xobjectName);
      smask.set("Subtype", imageName);
      smask.set("BitsPerComponent", 8);
      smask.set("ColorSpace", Name.get("DeviceGray"));
      smask.set("Width", width);
      smask.set("Height", height);
      smaskStream = new Stream(alphaBuffer, 0, 0, smask);
    }
    const imageStream = new Stream(await jpegBufferPromise, 0, 0, image);
    return {
      imageStream,
      smaskStream,
      width,
      height
    };
  }
  static createNewDict(annotation, xref, {
    apRef,
    ap
  }) {
    const {
      oldAnnotation,
      rect,
      rotation,
      user
    } = annotation;
    const stamp = oldAnnotation || new Dict(xref);
    stamp.set("Type", Name.get("Annot"));
    stamp.set("Subtype", Name.get("Stamp"));
    stamp.set(oldAnnotation ? "M" : "CreationDate", `D:${getModificationDate()}`);
    stamp.set("Rect", rect);
    stamp.set("F", 4);
    stamp.set("Border", [0, 0, 0]);
    stamp.set("Rotate", rotation);
    if (user) {
      stamp.set("T", stringToAsciiOrUTF16BE(user));
    }
    if (apRef || ap) {
      const n = new Dict(xref);
      stamp.set("AP", n);
      if (apRef) {
        n.set("N", apRef);
      } else {
        n.set("N", ap);
      }
    }
    return stamp;
  }
  static async #createNewAppearanceStreamForDrawing(annotation, xref) {
    const {
      areContours,
      color,
      rect,
      lines,
      thickness
    } = annotation;
    const appearanceBuffer = [`${thickness} w 1 J 1 j`, `${getPdfColor(color, areContours)}`];
    for (const line of lines) {
      appearanceBuffer.push(`${numberToString(line[4])} ${numberToString(line[5])} m`);
      for (let i = 6, ii = line.length; i < ii; i += 6) {
        if (isNaN(line[i])) {
          appearanceBuffer.push(`${numberToString(line[i + 4])} ${numberToString(line[i + 5])} l`);
        } else {
          const [c1x, c1y, c2x, c2y, x, y] = line.slice(i, i + 6);
          appearanceBuffer.push([c1x, c1y, c2x, c2y, x, y].map(numberToString).join(" ") + " c");
        }
      }
      if (line.length === 6) {
        appearanceBuffer.push(`${numberToString(line[4])} ${numberToString(line[5])} l`);
      }
    }
    appearanceBuffer.push(areContours ? "F" : "S");
    const appearance = appearanceBuffer.join("\n");
    const appearanceStreamDict = new Dict(xref);
    appearanceStreamDict.set("FormType", 1);
    appearanceStreamDict.set("Subtype", Name.get("Form"));
    appearanceStreamDict.set("Type", Name.get("XObject"));
    appearanceStreamDict.set("BBox", rect);
    appearanceStreamDict.set("Length", appearance.length);
    const ap = new StringStream(appearance);
    ap.dict = appearanceStreamDict;
    return ap;
  }
  static async createNewAppearanceStream(annotation, xref, params) {
    if (annotation.oldAnnotation) {
      return null;
    }
    if (annotation.isSignature) {
      return this.#createNewAppearanceStreamForDrawing(annotation, xref);
    }
    const {
      rotation
    } = annotation;
    const {
      imageRef,
      width,
      height
    } = params.image;
    const resources = new Dict(xref);
    const xobject = new Dict(xref);
    resources.set("XObject", xobject);
    xobject.set("Im0", imageRef);
    const appearance = `q ${width} 0 0 ${height} 0 0 cm /Im0 Do Q`;
    const appearanceStreamDict = new Dict(xref);
    appearanceStreamDict.set("FormType", 1);
    appearanceStreamDict.set("Subtype", Name.get("Form"));
    appearanceStreamDict.set("Type", Name.get("XObject"));
    appearanceStreamDict.set("BBox", [0, 0, width, height]);
    appearanceStreamDict.set("Resources", resources);
    if (rotation) {
      const matrix = getRotationMatrix(rotation, width, height);
      appearanceStreamDict.set("Matrix", matrix);
    }
    const ap = new StringStream(appearance);
    ap.dict = appearanceStreamDict;
    return ap;
  }
}
class FileAttachmentAnnotation extends MarkupAnnotation {
  constructor(params) {
    super(params);
    const {
      dict,
      xref
    } = params;
    const file = new FileSpec(dict.get("FS"), xref);
    this.data.annotationType = AnnotationType.FILEATTACHMENT;
    this.data.hasOwnCanvas = this.data.noRotate;
    this.data.noHTML = false;
    this.data.file = file.serializable;
    const name = dict.get("Name");
    this.data.name = name instanceof Name ? stringToPDFString(name.name) : "PushPin";
    const fillAlpha = dict.get("ca");
    this.data.fillAlpha = typeof fillAlpha === "number" && fillAlpha >= 0 && fillAlpha <= 1 ? fillAlpha : null;
  }
}

;// ./src/core/calculate_md5.js








const PARAMS = {
  get r() {
    return shadow(this, "r", new Uint8Array([7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21]));
  },
  get k() {
    return shadow(this, "k", new Int32Array([-680876936, -389564586, 606105819, -1044525330, -176418897, 1200080426, -1473231341, -45705983, 1770035416, -1958414417, -42063, -1990404162, 1804603682, -40341101, -1502002290, 1236535329, -165796510, -1069501632, 643717713, -373897302, -701558691, 38016083, -660478335, -405537848, 568446438, -1019803690, -187363961, 1163531501, -1444681467, -51403784, 1735328473, -1926607734, -378558, -2022574463, 1839030562, -35309556, -1530992060, 1272893353, -155497632, -1094730640, 681279174, -358537222, -722521979, 76029189, -640364487, -421815835, 530742520, -995338651, -198630844, 1126891415, -1416354905, -57434055, 1700485571, -1894986606, -1051523, -2054922799, 1873313359, -30611744, -1560198380, 1309151649, -145523070, -1120210379, 718787259, -343485551]));
  }
};
function calculateMD5(data, offset, length) {
  let h0 = 1732584193,
    h1 = -271733879,
    h2 = -1732584194,
    h3 = 271733878;
  const paddedLength = length + 72 & ~63;
  const padded = new Uint8Array(paddedLength);
  let i, j;
  for (i = 0; i < length; ++i) {
    padded[i] = data[offset++];
  }
  padded[i++] = 0x80;
  const n = paddedLength - 8;
  if (i < n) {
    i = n;
  }
  padded[i++] = length << 3 & 0xff;
  padded[i++] = length >> 5 & 0xff;
  padded[i++] = length >> 13 & 0xff;
  padded[i++] = length >> 21 & 0xff;
  padded[i++] = length >>> 29 & 0xff;
  i += 3;
  const w = new Int32Array(16);
  const {
    k,
    r
  } = PARAMS;
  for (i = 0; i < paddedLength;) {
    for (j = 0; j < 16; ++j, i += 4) {
      w[j] = padded[i] | padded[i + 1] << 8 | padded[i + 2] << 16 | padded[i + 3] << 24;
    }
    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      f,
      g;
    for (j = 0; j < 64; ++j) {
      if (j < 16) {
        f = b & c | ~b & d;
        g = j;
      } else if (j < 32) {
        f = d & b | ~d & c;
        g = 5 * j + 1 & 15;
      } else if (j < 48) {
        f = b ^ c ^ d;
        g = 3 * j + 5 & 15;
      } else {
        f = c ^ (b | ~d);
        g = 7 * j & 15;
      }
      const tmp = d,
        rotateArg = a + f + k[j] + w[g] | 0,
        rotate = r[j];
      d = c;
      c = b;
      b = b + (rotateArg << rotate | rotateArg >>> 32 - rotate) | 0;
      a = tmp;
    }
    h0 = h0 + a | 0;
    h1 = h1 + b | 0;
    h2 = h2 + c | 0;
    h3 = h3 + d | 0;
  }
  return new Uint8Array([h0 & 0xFF, h0 >> 8 & 0xFF, h0 >> 16 & 0xFF, h0 >>> 24 & 0xFF, h1 & 0xFF, h1 >> 8 & 0xFF, h1 >> 16 & 0xFF, h1 >>> 24 & 0xFF, h2 & 0xFF, h2 >> 8 & 0xFF, h2 >> 16 & 0xFF, h2 >>> 24 & 0xFF, h3 & 0xFF, h3 >> 8 & 0xFF, h3 >> 16 & 0xFF, h3 >>> 24 & 0xFF]);
}

;// ./src/core/dataset_reader.js





function decodeString(str) {
  try {
    return stringToUTF8String(str);
  } catch (ex) {
    warn(`UTF-8 decoding failed: "${ex}".`);
    return str;
  }
}
class DatasetXMLParser extends SimpleXMLParser {
  constructor(options) {
    super(options);
    this.node = null;
  }
  onEndElement(name) {
    const node = super.onEndElement(name);
    if (node && name === "xfa:datasets") {
      this.node = node;
      throw new Error("Aborting DatasetXMLParser.");
    }
  }
}
class DatasetReader {
  constructor(data) {
    if (data.datasets) {
      this.node = new SimpleXMLParser({
        hasAttributes: true
      }).parseFromString(data.datasets).documentElement;
    } else {
      const parser = new DatasetXMLParser({
        hasAttributes: true
      });
      try {
        parser.parseFromString(data["xdp:xdp"]);
      } catch {}
      this.node = parser.node;
    }
  }
  getValue(path) {
    if (!this.node || !path) {
      return "";
    }
    const node = this.node.searchNode(parseXFAPath(path), 0);
    if (!node) {
      return "";
    }
    const first = node.firstChild;
    if (first?.nodeName === "value") {
      return node.children.map(child => decodeString(child.textContent));
    }
    return decodeString(node.textContent);
  }
}

;// ./src/core/calculate_sha_other.js








class Word64 {
  constructor(highInteger, lowInteger) {
    this.high = highInteger | 0;
    this.low = lowInteger | 0;
  }
  and(word) {
    this.high &= word.high;
    this.low &= word.low;
  }
  xor(word) {
    this.high ^= word.high;
    this.low ^= word.low;
  }
  shiftRight(places) {
    if (places >= 32) {
      this.low = this.high >>> places - 32 | 0;
      this.high = 0;
    } else {
      this.low = this.low >>> places | this.high << 32 - places;
      this.high = this.high >>> places | 0;
    }
  }
  rotateRight(places) {
    let low, high;
    if (places & 32) {
      high = this.low;
      low = this.high;
    } else {
      low = this.low;
      high = this.high;
    }
    places &= 31;
    this.low = low >>> places | high << 32 - places;
    this.high = high >>> places | low << 32 - places;
  }
  not() {
    this.high = ~this.high;
    this.low = ~this.low;
  }
  add(word) {
    const lowAdd = (this.low >>> 0) + (word.low >>> 0);
    let highAdd = (this.high >>> 0) + (word.high >>> 0);
    if (lowAdd > 0xffffffff) {
      highAdd += 1;
    }
    this.low = lowAdd | 0;
    this.high = highAdd | 0;
  }
  copyTo(bytes, offset) {
    bytes[offset] = this.high >>> 24 & 0xff;
    bytes[offset + 1] = this.high >> 16 & 0xff;
    bytes[offset + 2] = this.high >> 8 & 0xff;
    bytes[offset + 3] = this.high & 0xff;
    bytes[offset + 4] = this.low >>> 24 & 0xff;
    bytes[offset + 5] = this.low >> 16 & 0xff;
    bytes[offset + 6] = this.low >> 8 & 0xff;
    bytes[offset + 7] = this.low & 0xff;
  }
  assign(word) {
    this.high = word.high;
    this.low = word.low;
  }
}
const calculate_sha_other_PARAMS = {
  get k() {
    return shadow(this, "k", [new Word64(0x428a2f98, 0xd728ae22), new Word64(0x71374491, 0x23ef65cd), new Word64(0xb5c0fbcf, 0xec4d3b2f), new Word64(0xe9b5dba5, 0x8189dbbc), new Word64(0x3956c25b, 0xf348b538), new Word64(0x59f111f1, 0xb605d019), new Word64(0x923f82a4, 0xaf194f9b), new Word64(0xab1c5ed5, 0xda6d8118), new Word64(0xd807aa98, 0xa3030242), new Word64(0x12835b01, 0x45706fbe), new Word64(0x243185be, 0x4ee4b28c), new Word64(0x550c7dc3, 0xd5ffb4e2), new Word64(0x72be5d74, 0xf27b896f), new Word64(0x80deb1fe, 0x3b1696b1), new Word64(0x9bdc06a7, 0x25c71235), new Word64(0xc19bf174, 0xcf692694), new Word64(0xe49b69c1, 0x9ef14ad2), new Word64(0xefbe4786, 0x384f25e3), new Word64(0x0fc19dc6, 0x8b8cd5b5), new Word64(0x240ca1cc, 0x77ac9c65), new Word64(0x2de92c6f, 0x592b0275), new Word64(0x4a7484aa, 0x6ea6e483), new Word64(0x5cb0a9dc, 0xbd41fbd4), new Word64(0x76f988da, 0x831153b5), new Word64(0x983e5152, 0xee66dfab), new Word64(0xa831c66d, 0x2db43210), new Word64(0xb00327c8, 0x98fb213f), new Word64(0xbf597fc7, 0xbeef0ee4), new Word64(0xc6e00bf3, 0x3da88fc2), new Word64(0xd5a79147, 0x930aa725), new Word64(0x06ca6351, 0xe003826f), new Word64(0x14292967, 0x0a0e6e70), new Word64(0x27b70a85, 0x46d22ffc), new Word64(0x2e1b2138, 0x5c26c926), new Word64(0x4d2c6dfc, 0x5ac42aed), new Word64(0x53380d13, 0x9d95b3df), new Word64(0x650a7354, 0x8baf63de), new Word64(0x766a0abb, 0x3c77b2a8), new Word64(0x81c2c92e, 0x47edaee6), new Word64(0x92722c85, 0x1482353b), new Word64(0xa2bfe8a1, 0x4cf10364), new Word64(0xa81a664b, 0xbc423001), new Word64(0xc24b8b70, 0xd0f89791), new Word64(0xc76c51a3, 0x0654be30), new Word64(0xd192e819, 0xd6ef5218), new Word64(0xd6990624, 0x5565a910), new Word64(0xf40e3585, 0x5771202a), new Word64(0x106aa070, 0x32bbd1b8), new Word64(0x19a4c116, 0xb8d2d0c8), new Word64(0x1e376c08, 0x5141ab53), new Word64(0x2748774c, 0xdf8eeb99), new Word64(0x34b0bcb5, 0xe19b48a8), new Word64(0x391c0cb3, 0xc5c95a63), new Word64(0x4ed8aa4a, 0xe3418acb), new Word64(0x5b9cca4f, 0x7763e373), new Word64(0x682e6ff3, 0xd6b2b8a3), new Word64(0x748f82ee, 0x5defb2fc), new Word64(0x78a5636f, 0x43172f60), new Word64(0x84c87814, 0xa1f0ab72), new Word64(0x8cc70208, 0x1a6439ec), new Word64(0x90befffa, 0x23631e28), new Word64(0xa4506ceb, 0xde82bde9), new Word64(0xbef9a3f7, 0xb2c67915), new Word64(0xc67178f2, 0xe372532b), new Word64(0xca273ece, 0xea26619c), new Word64(0xd186b8c7, 0x21c0c207), new Word64(0xeada7dd6, 0xcde0eb1e), new Word64(0xf57d4f7f, 0xee6ed178), new Word64(0x06f067aa, 0x72176fba), new Word64(0x0a637dc5, 0xa2c898a6), new Word64(0x113f9804, 0xbef90dae), new Word64(0x1b710b35, 0x131c471b), new Word64(0x28db77f5, 0x23047d84), new Word64(0x32caab7b, 0x40c72493), new Word64(0x3c9ebe0a, 0x15c9bebc), new Word64(0x431d67c4, 0x9c100d4c), new Word64(0x4cc5d4be, 0xcb3e42b6), new Word64(0x597f299c, 0xfc657e2a), new Word64(0x5fcb6fab, 0x3ad6faec), new Word64(0x6c44198c, 0x4a475817)]);
  }
};
function ch(result, x, y, z, tmp) {
  result.assign(x);
  result.and(y);
  tmp.assign(x);
  tmp.not();
  tmp.and(z);
  result.xor(tmp);
}
function maj(result, x, y, z, tmp) {
  result.assign(x);
  result.and(y);
  tmp.assign(x);
  tmp.and(z);
  result.xor(tmp);
  tmp.assign(y);
  tmp.and(z);
  result.xor(tmp);
}
function sigma(result, x, tmp) {
  result.assign(x);
  result.rotateRight(28);
  tmp.assign(x);
  tmp.rotateRight(34);
  result.xor(tmp);
  tmp.assign(x);
  tmp.rotateRight(39);
  result.xor(tmp);
}
function sigmaPrime(result, x, tmp) {
  result.assign(x);
  result.rotateRight(14);
  tmp.assign(x);
  tmp.rotateRight(18);
  result.xor(tmp);
  tmp.assign(x);
  tmp.rotateRight(41);
  result.xor(tmp);
}
function littleSigma(result, x, tmp) {
  result.assign(x);
  result.rotateRight(1);
  tmp.assign(x);
  tmp.rotateRight(8);
  result.xor(tmp);
  tmp.assign(x);
  tmp.shiftRight(7);
  result.xor(tmp);
}
function littleSigmaPrime(result, x, tmp) {
  result.assign(x);
  result.rotateRight(19);
  tmp.assign(x);
  tmp.rotateRight(61);
  result.xor(tmp);
  tmp.assign(x);
  tmp.shiftRight(6);
  result.xor(tmp);
}
function calculateSHA512(data, offset, length, mode384 = false) {
  let h0, h1, h2, h3, h4, h5, h6, h7;
  if (!mode384) {
    h0 = new Word64(0x6a09e667, 0xf3bcc908);
    h1 = new Word64(0xbb67ae85, 0x84caa73b);
    h2 = new Word64(0x3c6ef372, 0xfe94f82b);
    h3 = new Word64(0xa54ff53a, 0x5f1d36f1);
    h4 = new Word64(0x510e527f, 0xade682d1);
    h5 = new Word64(0x9b05688c, 0x2b3e6c1f);
    h6 = new Word64(0x1f83d9ab, 0xfb41bd6b);
    h7 = new Word64(0x5be0cd19, 0x137e2179);
  } else {
    h0 = new Word64(0xcbbb9d5d, 0xc1059ed8);
    h1 = new Word64(0x629a292a, 0x367cd507);
    h2 = new Word64(0x9159015a, 0x3070dd17);
    h3 = new Word64(0x152fecd8, 0xf70e5939);
    h4 = new Word64(0x67332667, 0xffc00b31);
    h5 = new Word64(0x8eb44a87, 0x68581511);
    h6 = new Word64(0xdb0c2e0d, 0x64f98fa7);
    h7 = new Word64(0x47b5481d, 0xbefa4fa4);
  }
  const paddedLength = Math.ceil((length + 17) / 128) * 128;
  const padded = new Uint8Array(paddedLength);
  let i, j;
  for (i = 0; i < length; ++i) {
    padded[i] = data[offset++];
  }
  padded[i++] = 0x80;
  const n = paddedLength - 16;
  if (i < n) {
    i = n;
  }
  i += 11;
  padded[i++] = length >>> 29 & 0xff;
  padded[i++] = length >> 21 & 0xff;
  padded[i++] = length >> 13 & 0xff;
  padded[i++] = length >> 5 & 0xff;
  padded[i++] = length << 3 & 0xff;
  const w = new Array(80);
  for (i = 0; i < 80; i++) {
    w[i] = new Word64(0, 0);
  }
  const {
    k
  } = calculate_sha_other_PARAMS;
  let a = new Word64(0, 0),
    b = new Word64(0, 0),
    c = new Word64(0, 0);
  let d = new Word64(0, 0),
    e = new Word64(0, 0),
    f = new Word64(0, 0);
  let g = new Word64(0, 0),
    h = new Word64(0, 0);
  const t1 = new Word64(0, 0),
    t2 = new Word64(0, 0);
  const tmp1 = new Word64(0, 0),
    tmp2 = new Word64(0, 0);
  let tmp3;
  for (i = 0; i < paddedLength;) {
    for (j = 0; j < 16; ++j) {
      w[j].high = padded[i] << 24 | padded[i + 1] << 16 | padded[i + 2] << 8 | padded[i + 3];
      w[j].low = padded[i + 4] << 24 | padded[i + 5] << 16 | padded[i + 6] << 8 | padded[i + 7];
      i += 8;
    }
    for (j = 16; j < 80; ++j) {
      tmp3 = w[j];
      littleSigmaPrime(tmp3, w[j - 2], tmp2);
      tmp3.add(w[j - 7]);
      littleSigma(tmp1, w[j - 15], tmp2);
      tmp3.add(tmp1);
      tmp3.add(w[j - 16]);
    }
    a.assign(h0);
    b.assign(h1);
    c.assign(h2);
    d.assign(h3);
    e.assign(h4);
    f.assign(h5);
    g.assign(h6);
    h.assign(h7);
    for (j = 0; j < 80; ++j) {
      t1.assign(h);
      sigmaPrime(tmp1, e, tmp2);
      t1.add(tmp1);
      ch(tmp1, e, f, g, tmp2);
      t1.add(tmp1);
      t1.add(k[j]);
      t1.add(w[j]);
      sigma(t2, a, tmp2);
      maj(tmp1, a, b, c, tmp2);
      t2.add(tmp1);
      tmp3 = h;
      h = g;
      g = f;
      f = e;
      d.add(t1);
      e = d;
      d = c;
      c = b;
      b = a;
      tmp3.assign(t1);
      tmp3.add(t2);
      a = tmp3;
    }
    h0.add(a);
    h1.add(b);
    h2.add(c);
    h3.add(d);
    h4.add(e);
    h5.add(f);
    h6.add(g);
    h7.add(h);
  }
  let result;
  if (!mode384) {
    result = new Uint8Array(64);
    h0.copyTo(result, 0);
    h1.copyTo(result, 8);
    h2.copyTo(result, 16);
    h3.copyTo(result, 24);
    h4.copyTo(result, 32);
    h5.copyTo(result, 40);
    h6.copyTo(result, 48);
    h7.copyTo(result, 56);
  } else {
    result = new Uint8Array(48);
    h0.copyTo(result, 0);
    h1.copyTo(result, 8);
    h2.copyTo(result, 16);
    h3.copyTo(result, 24);
    h4.copyTo(result, 32);
    h5.copyTo(result, 40);
  }
  return result;
}
function calculateSHA384(data, offset, length) {
  return calculateSHA512(data, offset, length, true);
}

;// ./src/core/calculate_sha256.js








const calculate_sha256_PARAMS = {
  get k() {
    return shadow(this, "k", [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
  }
};
function rotr(x, n) {
  return x >>> n | x << 32 - n;
}
function calculate_sha256_ch(x, y, z) {
  return x & y ^ ~x & z;
}
function calculate_sha256_maj(x, y, z) {
  return x & y ^ x & z ^ y & z;
}
function calculate_sha256_sigma(x) {
  return rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22);
}
function calculate_sha256_sigmaPrime(x) {
  return rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25);
}
function calculate_sha256_littleSigma(x) {
  return rotr(x, 7) ^ rotr(x, 18) ^ x >>> 3;
}
function calculate_sha256_littleSigmaPrime(x) {
  return rotr(x, 17) ^ rotr(x, 19) ^ x >>> 10;
}
function calculateSHA256(data, offset, length) {
  let h0 = 0x6a09e667,
    h1 = 0xbb67ae85,
    h2 = 0x3c6ef372,
    h3 = 0xa54ff53a,
    h4 = 0x510e527f,
    h5 = 0x9b05688c,
    h6 = 0x1f83d9ab,
    h7 = 0x5be0cd19;
  const paddedLength = Math.ceil((length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  let i, j;
  for (i = 0; i < length; ++i) {
    padded[i] = data[offset++];
  }
  padded[i++] = 0x80;
  const n = paddedLength - 8;
  if (i < n) {
    i = n;
  }
  i += 3;
  padded[i++] = length >>> 29 & 0xff;
  padded[i++] = length >> 21 & 0xff;
  padded[i++] = length >> 13 & 0xff;
  padded[i++] = length >> 5 & 0xff;
  padded[i++] = length << 3 & 0xff;
  const w = new Uint32Array(64);
  const {
    k
  } = calculate_sha256_PARAMS;
  for (i = 0; i < paddedLength;) {
    for (j = 0; j < 16; ++j) {
      w[j] = padded[i] << 24 | padded[i + 1] << 16 | padded[i + 2] << 8 | padded[i + 3];
      i += 4;
    }
    for (j = 16; j < 64; ++j) {
      w[j] = calculate_sha256_littleSigmaPrime(w[j - 2]) + w[j - 7] + calculate_sha256_littleSigma(w[j - 15]) + w[j - 16] | 0;
    }
    let a = h0,
      b = h1,
      c = h2,
      d = h3,
      e = h4,
      f = h5,
      g = h6,
      h = h7,
      t1,
      t2;
    for (j = 0; j < 64; ++j) {
      t1 = h + calculate_sha256_sigmaPrime(e) + calculate_sha256_ch(e, f, g) + k[j] + w[j];
      t2 = calculate_sha256_sigma(a) + calculate_sha256_maj(a, b, c);
      h = g;
      g = f;
      f = e;
      e = d + t1 | 0;
      d = c;
      c = b;
      b = a;
      a = t1 + t2 | 0;
    }
    h0 = h0 + a | 0;
    h1 = h1 + b | 0;
    h2 = h2 + c | 0;
    h3 = h3 + d | 0;
    h4 = h4 + e | 0;
    h5 = h5 + f | 0;
    h6 = h6 + g | 0;
    h7 = h7 + h | 0;
  }
  return new Uint8Array([h0 >> 24 & 0xFF, h0 >> 16 & 0xFF, h0 >> 8 & 0xFF, h0 & 0xFF, h1 >> 24 & 0xFF, h1 >> 16 & 0xFF, h1 >> 8 & 0xFF, h1 & 0xFF, h2 >> 24 & 0xFF, h2 >> 16 & 0xFF, h2 >> 8 & 0xFF, h2 & 0xFF, h3 >> 24 & 0xFF, h3 >> 16 & 0xFF, h3 >> 8 & 0xFF, h3 & 0xFF, h4 >> 24 & 0xFF, h4 >> 16 & 0xFF, h4 >> 8 & 0xFF, h4 & 0xFF, h5 >> 24 & 0xFF, h5 >> 16 & 0xFF, h5 >> 8 & 0xFF, h5 & 0xFF, h6 >> 24 & 0xFF, h6 >> 16 & 0xFF, h6 >> 8 & 0xFF, h6 & 0xFF, h7 >> 24 & 0xFF, h7 >> 16 & 0xFF, h7 >> 8 & 0xFF, h7 & 0xFF]);
}

;// ./src/core/decrypt_stream.js

const chunkSize = 512;
class DecryptStream extends DecodeStream {
  constructor(str, maybeLength, decrypt) {
    super(maybeLength);
    this.str = str;
    this.dict = str.dict;
    this.decrypt = decrypt;
    this.nextChunk = null;
    this.initialized = false;
  }
  readBlock() {
    let chunk;
    if (this.initialized) {
      chunk = this.nextChunk;
    } else {
      chunk = this.str.getBytes(chunkSize);
      this.initialized = true;
    }
    if (!chunk?.length) {
      this.eof = true;
      return;
    }
    this.nextChunk = this.str.getBytes(chunkSize);
    const hasMoreData = this.nextChunk?.length > 0;
    const decrypt = this.decrypt;
    chunk = decrypt(chunk, !hasMoreData);
    const bufferLength = this.bufferLength,
      newLength = bufferLength + chunk.length,
      buffer = this.ensureBuffer(newLength);
    buffer.set(chunk, bufferLength);
    this.bufferLength = newLength;
  }
}

;// ./src/core/crypto.js

















class ARCFourCipher {
  constructor(key) {
    this.a = 0;
    this.b = 0;
    const s = new Uint8Array(256);
    const keyLength = key.length;
    for (let i = 0; i < 256; ++i) {
      s[i] = i;
    }
    for (let i = 0, j = 0; i < 256; ++i) {
      const tmp = s[i];
      j = j + tmp + key[i % keyLength] & 0xff;
      s[i] = s[j];
      s[j] = tmp;
    }
    this.s = s;
  }
  encryptBlock(data) {
    let a = this.a,
      b = this.b;
    const s = this.s;
    const n = data.length;
    const output = new Uint8Array(n);
    for (let i = 0; i < n; ++i) {
      a = a + 1 & 0xff;
      const tmp = s[a];
      b = b + tmp & 0xff;
      const tmp2 = s[b];
      s[a] = tmp2;
      s[b] = tmp;
      output[i] = data[i] ^ s[tmp + tmp2 & 0xff];
    }
    this.a = a;
    this.b = b;
    return output;
  }
  decryptBlock(data) {
    return this.encryptBlock(data);
  }
  encrypt(data) {
    return this.encryptBlock(data);
  }
}
class NullCipher {
  decryptBlock(data) {
    return data;
  }
  encrypt(data) {
    return data;
  }
}
class AESBaseCipher {
  _s = new Uint8Array([0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76, 0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0, 0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15, 0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75, 0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84, 0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf, 0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8, 0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2, 0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73, 0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb, 0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79, 0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08, 0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a, 0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e, 0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf, 0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16]);
  _inv_s = new Uint8Array([0x52, 0x09, 0x6a, 0xd5, 0x30, 0x36, 0xa5, 0x38, 0xbf, 0x40, 0xa3, 0x9e, 0x81, 0xf3, 0xd7, 0xfb, 0x7c, 0xe3, 0x39, 0x82, 0x9b, 0x2f, 0xff, 0x87, 0x34, 0x8e, 0x43, 0x44, 0xc4, 0xde, 0xe9, 0xcb, 0x54, 0x7b, 0x94, 0x32, 0xa6, 0xc2, 0x23, 0x3d, 0xee, 0x4c, 0x95, 0x0b, 0x42, 0xfa, 0xc3, 0x4e, 0x08, 0x2e, 0xa1, 0x66, 0x28, 0xd9, 0x24, 0xb2, 0x76, 0x5b, 0xa2, 0x49, 0x6d, 0x8b, 0xd1, 0x25, 0x72, 0xf8, 0xf6, 0x64, 0x86, 0x68, 0x98, 0x16, 0xd4, 0xa4, 0x5c, 0xcc, 0x5d, 0x65, 0xb6, 0x92, 0x6c, 0x70, 0x48, 0x50, 0xfd, 0xed, 0xb9, 0xda, 0x5e, 0x15, 0x46, 0x57, 0xa7, 0x8d, 0x9d, 0x84, 0x90, 0xd8, 0xab, 0x00, 0x8c, 0xbc, 0xd3, 0x0a, 0xf7, 0xe4, 0x58, 0x05, 0xb8, 0xb3, 0x45, 0x06, 0xd0, 0x2c, 0x1e, 0x8f, 0xca, 0x3f, 0x0f, 0x02, 0xc1, 0xaf, 0xbd, 0x03, 0x01, 0x13, 0x8a, 0x6b, 0x3a, 0x91, 0x11, 0x41, 0x4f, 0x67, 0xdc, 0xea, 0x97, 0xf2, 0xcf, 0xce, 0xf0, 0xb4, 0xe6, 0x73, 0x96, 0xac, 0x74, 0x22, 0xe7, 0xad, 0x35, 0x85, 0xe2, 0xf9, 0x37, 0xe8, 0x1c, 0x75, 0xdf, 0x6e, 0x47, 0xf1, 0x1a, 0x71, 0x1d, 0x29, 0xc5, 0x89, 0x6f, 0xb7, 0x62, 0x0e, 0xaa, 0x18, 0xbe, 0x1b, 0xfc, 0x56, 0x3e, 0x4b, 0xc6, 0xd2, 0x79, 0x20, 0x9a, 0xdb, 0xc0, 0xfe, 0x78, 0xcd, 0x5a, 0xf4, 0x1f, 0xdd, 0xa8, 0x33, 0x88, 0x07, 0xc7, 0x31, 0xb1, 0x12, 0x10, 0x59, 0x27, 0x80, 0xec, 0x5f, 0x60, 0x51, 0x7f, 0xa9, 0x19, 0xb5, 0x4a, 0x0d, 0x2d, 0xe5, 0x7a, 0x9f, 0x93, 0xc9, 0x9c, 0xef, 0xa0, 0xe0, 0x3b, 0x4d, 0xae, 0x2a, 0xf5, 0xb0, 0xc8, 0xeb, 0xbb, 0x3c, 0x83, 0x53, 0x99, 0x61, 0x17, 0x2b, 0x04, 0x7e, 0xba, 0x77, 0xd6, 0x26, 0xe1, 0x69, 0x14, 0x63, 0x55, 0x21, 0x0c, 0x7d]);
  _mix = new Uint32Array([0x00000000, 0x0e090d0b, 0x1c121a16, 0x121b171d, 0x3824342c, 0x362d3927, 0x24362e3a, 0x2a3f2331, 0x70486858, 0x7e416553, 0x6c5a724e, 0x62537f45, 0x486c5c74, 0x4665517f, 0x547e4662, 0x5a774b69, 0xe090d0b0, 0xee99ddbb, 0xfc82caa6, 0xf28bc7ad, 0xd8b4e49c, 0xd6bde997, 0xc4a6fe8a, 0xcaaff381, 0x90d8b8e8, 0x9ed1b5e3, 0x8ccaa2fe, 0x82c3aff5, 0xa8fc8cc4, 0xa6f581cf, 0xb4ee96d2, 0xbae79bd9, 0xdb3bbb7b, 0xd532b670, 0xc729a16d, 0xc920ac66, 0xe31f8f57, 0xed16825c, 0xff0d9541, 0xf104984a, 0xab73d323, 0xa57ade28, 0xb761c935, 0xb968c43e, 0x9357e70f, 0x9d5eea04, 0x8f45fd19, 0x814cf012, 0x3bab6bcb, 0x35a266c0, 0x27b971dd, 0x29b07cd6, 0x038f5fe7, 0x0d8652ec, 0x1f9d45f1, 0x119448fa, 0x4be30393, 0x45ea0e98, 0x57f11985, 0x59f8148e, 0x73c737bf, 0x7dce3ab4, 0x6fd52da9, 0x61dc20a2, 0xad766df6, 0xa37f60fd, 0xb16477e0, 0xbf6d7aeb, 0x955259da, 0x9b5b54d1, 0x894043cc, 0x87494ec7, 0xdd3e05ae, 0xd33708a5, 0xc12c1fb8, 0xcf2512b3, 0xe51a3182, 0xeb133c89, 0xf9082b94, 0xf701269f, 0x4de6bd46, 0x43efb04d, 0x51f4a750, 0x5ffdaa5b, 0x75c2896a, 0x7bcb8461, 0x69d0937c, 0x67d99e77, 0x3daed51e, 0x33a7d815, 0x21bccf08, 0x2fb5c203, 0x058ae132, 0x0b83ec39, 0x1998fb24, 0x1791f62f, 0x764dd68d, 0x7844db86, 0x6a5fcc9b, 0x6456c190, 0x4e69e2a1, 0x4060efaa, 0x527bf8b7, 0x5c72f5bc, 0x0605bed5, 0x080cb3de, 0x1a17a4c3, 0x141ea9c8, 0x3e218af9, 0x302887f2, 0x223390ef, 0x2c3a9de4, 0x96dd063d, 0x98d40b36, 0x8acf1c2b, 0x84c61120, 0xaef93211, 0xa0f03f1a, 0xb2eb2807, 0xbce2250c, 0xe6956e65, 0xe89c636e, 0xfa877473, 0xf48e7978, 0xdeb15a49, 0xd0b85742, 0xc2a3405f, 0xccaa4d54, 0x41ecdaf7, 0x4fe5d7fc, 0x5dfec0e1, 0x53f7cdea, 0x79c8eedb, 0x77c1e3d0, 0x65daf4cd, 0x6bd3f9c6, 0x31a4b2af, 0x3fadbfa4, 0x2db6a8b9, 0x23bfa5b2, 0x09808683, 0x07898b88, 0x15929c95, 0x1b9b919e, 0xa17c0a47, 0xaf75074c, 0xbd6e1051, 0xb3671d5a, 0x99583e6b, 0x97513360, 0x854a247d, 0x8b432976, 0xd134621f, 0xdf3d6f14, 0xcd267809, 0xc32f7502, 0xe9105633, 0xe7195b38, 0xf5024c25, 0xfb0b412e, 0x9ad7618c, 0x94de6c87, 0x86c57b9a, 0x88cc7691, 0xa2f355a0, 0xacfa58ab, 0xbee14fb6, 0xb0e842bd, 0xea9f09d4, 0xe49604df, 0xf68d13c2, 0xf8841ec9, 0xd2bb3df8, 0xdcb230f3, 0xcea927ee, 0xc0a02ae5, 0x7a47b13c, 0x744ebc37, 0x6655ab2a, 0x685ca621, 0x42638510, 0x4c6a881b, 0x5e719f06, 0x5078920d, 0x0a0fd964, 0x0406d46f, 0x161dc372, 0x1814ce79, 0x322bed48, 0x3c22e043, 0x2e39f75e, 0x2030fa55, 0xec9ab701, 0xe293ba0a, 0xf088ad17, 0xfe81a01c, 0xd4be832d, 0xdab78e26, 0xc8ac993b, 0xc6a59430, 0x9cd2df59, 0x92dbd252, 0x80c0c54f, 0x8ec9c844, 0xa4f6eb75, 0xaaffe67e, 0xb8e4f163, 0xb6edfc68, 0x0c0a67b1, 0x02036aba, 0x10187da7, 0x1e1170ac, 0x342e539d, 0x3a275e96, 0x283c498b, 0x26354480, 0x7c420fe9, 0x724b02e2, 0x605015ff, 0x6e5918f4, 0x44663bc5, 0x4a6f36ce, 0x587421d3, 0x567d2cd8, 0x37a10c7a, 0x39a80171, 0x2bb3166c, 0x25ba1b67, 0x0f853856, 0x018c355d, 0x13972240, 0x1d9e2f4b, 0x47e96422, 0x49e06929, 0x5bfb7e34, 0x55f2733f, 0x7fcd500e, 0x71c45d05, 0x63df4a18, 0x6dd64713, 0xd731dcca, 0xd938d1c1, 0xcb23c6dc, 0xc52acbd7, 0xef15e8e6, 0xe11ce5ed, 0xf307f2f0, 0xfd0efffb, 0xa779b492, 0xa970b999, 0xbb6bae84, 0xb562a38f, 0x9f5d80be, 0x91548db5, 0x834f9aa8, 0x8d4697a3]);
  _mixCol = new Uint8Array(256).map((_, i) => i < 128 ? i << 1 : i << 1 ^ 0x1b);
  constructor() {
    this.buffer = new Uint8Array(16);
    this.bufferPosition = 0;
  }
  _expandKey(cipherKey) {
    unreachable("Cannot call `_expandKey` on the base class");
  }
  _decrypt(input, key) {
    let t, u, v;
    const state = new Uint8Array(16);
    state.set(input);
    for (let j = 0, k = this._keySize; j < 16; ++j, ++k) {
      state[j] ^= key[k];
    }
    for (let i = this._cyclesOfRepetition - 1; i >= 1; --i) {
      t = state[13];
      state[13] = state[9];
      state[9] = state[5];
      state[5] = state[1];
      state[1] = t;
      t = state[14];
      u = state[10];
      state[14] = state[6];
      state[10] = state[2];
      state[6] = t;
      state[2] = u;
      t = state[15];
      u = state[11];
      v = state[7];
      state[15] = state[3];
      state[11] = t;
      state[7] = u;
      state[3] = v;
      for (let j = 0; j < 16; ++j) {
        state[j] = this._inv_s[state[j]];
      }
      for (let j = 0, k = i * 16; j < 16; ++j, ++k) {
        state[j] ^= key[k];
      }
      for (let j = 0; j < 16; j += 4) {
        const s0 = this._mix[state[j]];
        const s1 = this._mix[state[j + 1]];
        const s2 = this._mix[state[j + 2]];
        const s3 = this._mix[state[j + 3]];
        t = s0 ^ s1 >>> 8 ^ s1 << 24 ^ s2 >>> 16 ^ s2 << 16 ^ s3 >>> 24 ^ s3 << 8;
        state[j] = t >>> 24 & 0xff;
        state[j + 1] = t >> 16 & 0xff;
        state[j + 2] = t >> 8 & 0xff;
        state[j + 3] = t & 0xff;
      }
    }
    t = state[13];
    state[13] = state[9];
    state[9] = state[5];
    state[5] = state[1];
    state[1] = t;
    t = state[14];
    u = state[10];
    state[14] = state[6];
    state[10] = state[2];
    state[6] = t;
    state[2] = u;
    t = state[15];
    u = state[11];
    v = state[7];
    state[15] = state[3];
    state[11] = t;
    state[7] = u;
    state[3] = v;
    for (let j = 0; j < 16; ++j) {
      state[j] = this._inv_s[state[j]];
      state[j] ^= key[j];
    }
    return state;
  }
  _encrypt(input, key) {
    const s = this._s;
    let t, u, v;
    const state = new Uint8Array(16);
    state.set(input);
    for (let j = 0; j < 16; ++j) {
      state[j] ^= key[j];
    }
    for (let i = 1; i < this._cyclesOfRepetition; i++) {
      for (let j = 0; j < 16; ++j) {
        state[j] = s[state[j]];
      }
      v = state[1];
      state[1] = state[5];
      state[5] = state[9];
      state[9] = state[13];
      state[13] = v;
      v = state[2];
      u = state[6];
      state[2] = state[10];
      state[6] = state[14];
      state[10] = v;
      state[14] = u;
      v = state[3];
      u = state[7];
      t = state[11];
      state[3] = state[15];
      state[7] = v;
      state[11] = u;
      state[15] = t;
      for (let j = 0; j < 16; j += 4) {
        const s0 = state[j];
        const s1 = state[j + 1];
        const s2 = state[j + 2];
        const s3 = state[j + 3];
        t = s0 ^ s1 ^ s2 ^ s3;
        state[j] ^= t ^ this._mixCol[s0 ^ s1];
        state[j + 1] ^= t ^ this._mixCol[s1 ^ s2];
        state[j + 2] ^= t ^ this._mixCol[s2 ^ s3];
        state[j + 3] ^= t ^ this._mixCol[s3 ^ s0];
      }
      for (let j = 0, k = i * 16; j < 16; ++j, ++k) {
        state[j] ^= key[k];
      }
    }
    for (let j = 0; j < 16; ++j) {
      state[j] = s[state[j]];
    }
    v = state[1];
    state[1] = state[5];
    state[5] = state[9];
    state[9] = state[13];
    state[13] = v;
    v = state[2];
    u = state[6];
    state[2] = state[10];
    state[6] = state[14];
    state[10] = v;
    state[14] = u;
    v = state[3];
    u = state[7];
    t = state[11];
    state[3] = state[15];
    state[7] = v;
    state[11] = u;
    state[15] = t;
    for (let j = 0, k = this._keySize; j < 16; ++j, ++k) {
      state[j] ^= key[k];
    }
    return state;
  }
  _decryptBlock2(data, finalize) {
    const sourceLength = data.length;
    let buffer = this.buffer,
      bufferLength = this.bufferPosition;
    const result = [];
    let iv = this.iv;
    for (let i = 0; i < sourceLength; ++i) {
      buffer[bufferLength] = data[i];
      ++bufferLength;
      if (bufferLength < 16) {
        continue;
      }
      const plain = this._decrypt(buffer, this._key);
      for (let j = 0; j < 16; ++j) {
        plain[j] ^= iv[j];
      }
      iv = buffer;
      result.push(plain);
      buffer = new Uint8Array(16);
      bufferLength = 0;
    }
    this.buffer = buffer;
    this.bufferLength = bufferLength;
    this.iv = iv;
    if (result.length === 0) {
      return new Uint8Array(0);
    }
    let outputLength = 16 * result.length;
    if (finalize) {
      const lastBlock = result.at(-1);
      let psLen = lastBlock[15];
      if (psLen <= 16) {
        for (let i = 15, ii = 16 - psLen; i >= ii; --i) {
          if (lastBlock[i] !== psLen) {
            psLen = 0;
            break;
          }
        }
        outputLength -= psLen;
        result[result.length - 1] = lastBlock.subarray(0, 16 - psLen);
      }
    }
    const output = new Uint8Array(outputLength);
    for (let i = 0, j = 0, ii = result.length; i < ii; ++i, j += 16) {
      output.set(result[i], j);
    }
    return output;
  }
  decryptBlock(data, finalize, iv = null) {
    const sourceLength = data.length;
    const buffer = this.buffer;
    let bufferLength = this.bufferPosition;
    if (iv) {
      this.iv = iv;
    } else {
      for (let i = 0; bufferLength < 16 && i < sourceLength; ++i, ++bufferLength) {
        buffer[bufferLength] = data[i];
      }
      if (bufferLength < 16) {
        this.bufferLength = bufferLength;
        return new Uint8Array(0);
      }
      this.iv = buffer;
      data = data.subarray(16);
    }
    this.buffer = new Uint8Array(16);
    this.bufferLength = 0;
    this.decryptBlock = this._decryptBlock2;
    return this.decryptBlock(data, finalize);
  }
  encrypt(data, iv) {
    const sourceLength = data.length;
    let buffer = this.buffer,
      bufferLength = this.bufferPosition;
    const result = [];
    iv ||= new Uint8Array(16);
    for (let i = 0; i < sourceLength; ++i) {
      buffer[bufferLength] = data[i];
      ++bufferLength;
      if (bufferLength < 16) {
        continue;
      }
      for (let j = 0; j < 16; ++j) {
        buffer[j] ^= iv[j];
      }
      const cipher = this._encrypt(buffer, this._key);
      iv = cipher;
      result.push(cipher);
      buffer = new Uint8Array(16);
      bufferLength = 0;
    }
    this.buffer = buffer;
    this.bufferLength = bufferLength;
    this.iv = iv;
    if (result.length === 0) {
      return new Uint8Array(0);
    }
    const outputLength = 16 * result.length;
    const output = new Uint8Array(outputLength);
    for (let i = 0, j = 0, ii = result.length; i < ii; ++i, j += 16) {
      output.set(result[i], j);
    }
    return output;
  }
}
class AES128Cipher extends AESBaseCipher {
  _rcon = new Uint8Array([0x8d, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a, 0x2f, 0x5e, 0xbc, 0x63, 0xc6, 0x97, 0x35, 0x6a, 0xd4, 0xb3, 0x7d, 0xfa, 0xef, 0xc5, 0x91, 0x39, 0x72, 0xe4, 0xd3, 0xbd, 0x61, 0xc2, 0x9f, 0x25, 0x4a, 0x94, 0x33, 0x66, 0xcc, 0x83, 0x1d, 0x3a, 0x74, 0xe8, 0xcb, 0x8d, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a, 0x2f, 0x5e, 0xbc, 0x63, 0xc6, 0x97, 0x35, 0x6a, 0xd4, 0xb3, 0x7d, 0xfa, 0xef, 0xc5, 0x91, 0x39, 0x72, 0xe4, 0xd3, 0xbd, 0x61, 0xc2, 0x9f, 0x25, 0x4a, 0x94, 0x33, 0x66, 0xcc, 0x83, 0x1d, 0x3a, 0x74, 0xe8, 0xcb, 0x8d, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a, 0x2f, 0x5e, 0xbc, 0x63, 0xc6, 0x97, 0x35, 0x6a, 0xd4, 0xb3, 0x7d, 0xfa, 0xef, 0xc5, 0x91, 0x39, 0x72, 0xe4, 0xd3, 0xbd, 0x61, 0xc2, 0x9f, 0x25, 0x4a, 0x94, 0x33, 0x66, 0xcc, 0x83, 0x1d, 0x3a, 0x74, 0xe8, 0xcb, 0x8d, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a, 0x2f, 0x5e, 0xbc, 0x63, 0xc6, 0x97, 0x35, 0x6a, 0xd4, 0xb3, 0x7d, 0xfa, 0xef, 0xc5, 0x91, 0x39, 0x72, 0xe4, 0xd3, 0xbd, 0x61, 0xc2, 0x9f, 0x25, 0x4a, 0x94, 0x33, 0x66, 0xcc, 0x83, 0x1d, 0x3a, 0x74, 0xe8, 0xcb, 0x8d, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36, 0x6c, 0xd8, 0xab, 0x4d, 0x9a, 0x2f, 0x5e, 0xbc, 0x63, 0xc6, 0x97, 0x35, 0x6a, 0xd4, 0xb3, 0x7d, 0xfa, 0xef, 0xc5, 0x91, 0x39, 0x72, 0xe4, 0xd3, 0xbd, 0x61, 0xc2, 0x9f, 0x25, 0x4a, 0x94, 0x33, 0x66, 0xcc, 0x83, 0x1d, 0x3a, 0x74, 0xe8, 0xcb, 0x8d]);
  constructor(key) {
    super();
    this._cyclesOfRepetition = 10;
    this._keySize = 160;
    this._key = this._expandKey(key);
  }
  _expandKey(cipherKey) {
    const b = 176;
    const s = this._s;
    const rcon = this._rcon;
    const result = new Uint8Array(b);
    result.set(cipherKey);
    for (let j = 16, i = 1; j < b; ++i) {
      let t1 = result[j - 3];
      let t2 = result[j - 2];
      let t3 = result[j - 1];
      let t4 = result[j - 4];
      t1 = s[t1];
      t2 = s[t2];
      t3 = s[t3];
      t4 = s[t4];
      t1 ^= rcon[i];
      for (let n = 0; n < 4; ++n) {
        result[j] = t1 ^= result[j - 16];
        j++;
        result[j] = t2 ^= result[j - 16];
        j++;
        result[j] = t3 ^= result[j - 16];
        j++;
        result[j] = t4 ^= result[j - 16];
        j++;
      }
    }
    return result;
  }
}
class AES256Cipher extends AESBaseCipher {
  constructor(key) {
    super();
    this._cyclesOfRepetition = 14;
    this._keySize = 224;
    this._key = this._expandKey(key);
  }
  _expandKey(cipherKey) {
    const b = 240;
    const s = this._s;
    const result = new Uint8Array(b);
    result.set(cipherKey);
    let r = 1;
    let t1, t2, t3, t4;
    for (let j = 32, i = 1; j < b; ++i) {
      if (j % 32 === 16) {
        t1 = s[t1];
        t2 = s[t2];
        t3 = s[t3];
        t4 = s[t4];
      } else if (j % 32 === 0) {
        t1 = result[j - 3];
        t2 = result[j - 2];
        t3 = result[j - 1];
        t4 = result[j - 4];
        t1 = s[t1];
        t2 = s[t2];
        t3 = s[t3];
        t4 = s[t4];
        t1 ^= r;
        if ((r <<= 1) >= 256) {
          r = (r ^ 0x1b) & 0xff;
        }
      }
      for (let n = 0; n < 4; ++n) {
        result[j] = t1 ^= result[j - 32];
        j++;
        result[j] = t2 ^= result[j - 32];
        j++;
        result[j] = t3 ^= result[j - 32];
        j++;
        result[j] = t4 ^= result[j - 32];
        j++;
      }
    }
    return result;
  }
}
class PDFBase {
  _hash(password, input, userBytes) {
    unreachable("Abstract method `_hash` called");
  }
  checkOwnerPassword(password, ownerValidationSalt, userBytes, ownerPassword) {
    const hashData = new Uint8Array(password.length + 56);
    hashData.set(password, 0);
    hashData.set(ownerValidationSalt, password.length);
    hashData.set(userBytes, password.length + ownerValidationSalt.length);
    const result = this._hash(password, hashData, userBytes);
    return isArrayEqual(result, ownerPassword);
  }
  checkUserPassword(password, userValidationSalt, userPassword) {
    const hashData = new Uint8Array(password.length + 8);
    hashData.set(password, 0);
    hashData.set(userValidationSalt, password.length);
    const result = this._hash(password, hashData, []);
    return isArrayEqual(result, userPassword);
  }
  getOwnerKey(password, ownerKeySalt, userBytes, ownerEncryption) {
    const hashData = new Uint8Array(password.length + 56);
    hashData.set(password, 0);
    hashData.set(ownerKeySalt, password.length);
    hashData.set(userBytes, password.length + ownerKeySalt.length);
    const key = this._hash(password, hashData, userBytes);
    const cipher = new AES256Cipher(key);
    return cipher.decryptBlock(ownerEncryption, false, new Uint8Array(16));
  }
  getUserKey(password, userKeySalt, userEncryption) {
    const hashData = new Uint8Array(password.length + 8);
    hashData.set(password, 0);
    hashData.set(userKeySalt, password.length);
    const key = this._hash(password, hashData, []);
    const cipher = new AES256Cipher(key);
    return cipher.decryptBlock(userEncryption, false, new Uint8Array(16));
  }
}
class PDF17 extends PDFBase {
  _hash(password, input, userBytes) {
    return calculateSHA256(input, 0, input.length);
  }
}
class PDF20 extends PDFBase {
  _hash(password, input, userBytes) {
    let k = calculateSHA256(input, 0, input.length).subarray(0, 32);
    let e = [0];
    let i = 0;
    while (i < 64 || e.at(-1) > i - 32) {
      const combinedLength = password.length + k.length + userBytes.length,
        combinedArray = new Uint8Array(combinedLength);
      let writeOffset = 0;
      combinedArray.set(password, writeOffset);
      writeOffset += password.length;
      combinedArray.set(k, writeOffset);
      writeOffset += k.length;
      combinedArray.set(userBytes, writeOffset);
      const k1 = new Uint8Array(combinedLength * 64);
      for (let j = 0, pos = 0; j < 64; j++, pos += combinedLength) {
        k1.set(combinedArray, pos);
      }
      const cipher = new AES128Cipher(k.subarray(0, 16));
      e = cipher.encrypt(k1, k.subarray(16, 32));
      const remainder = Math.sumPrecise(e.slice(0, 16)) % 3;
      if (remainder === 0) {
        k = calculateSHA256(e, 0, e.length);
      } else if (remainder === 1) {
        k = calculateSHA384(e, 0, e.length);
      } else if (remainder === 2) {
        k = calculateSHA512(e, 0, e.length);
      }
      i++;
    }
    return k.subarray(0, 32);
  }
}
class CipherTransform {
  constructor(stringCipherConstructor, streamCipherConstructor) {
    this.StringCipherConstructor = stringCipherConstructor;
    this.StreamCipherConstructor = streamCipherConstructor;
  }
  createStream(stream, length) {
    const cipher = new this.StreamCipherConstructor();
    return new DecryptStream(stream, length, function cipherTransformDecryptStream(data, finalize) {
      return cipher.decryptBlock(data, finalize);
    });
  }
  decryptString(s) {
    const cipher = new this.StringCipherConstructor();
    let data = stringToBytes(s);
    data = cipher.decryptBlock(data, true);
    return bytesToString(data);
  }
  encryptString(s) {
    const cipher = new this.StringCipherConstructor();
    if (cipher instanceof AESBaseCipher) {
      const strLen = s.length;
      const pad = 16 - strLen % 16;
      s += String.fromCharCode(pad).repeat(pad);
      const iv = new Uint8Array(16);
      crypto.getRandomValues(iv);
      let data = stringToBytes(s);
      data = cipher.encrypt(data, iv);
      const buf = new Uint8Array(16 + data.length);
      buf.set(iv);
      buf.set(data, 16);
      return bytesToString(buf);
    }
    let data = stringToBytes(s);
    data = cipher.encrypt(data);
    return bytesToString(data);
  }
}
class CipherTransformFactory {
  static get _defaultPasswordBytes() {
    return shadow(this, "_defaultPasswordBytes", new Uint8Array([0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41, 0x64, 0x00, 0x4e, 0x56, 0xff, 0xfa, 0x01, 0x08, 0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80, 0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a]));
  }
  #createEncryptionKey20(revision, password, ownerPassword, ownerValidationSalt, ownerKeySalt, uBytes, userPassword, userValidationSalt, userKeySalt, ownerEncryption, userEncryption, perms) {
    if (password) {
      const passwordLength = Math.min(127, password.length);
      password = password.subarray(0, passwordLength);
    } else {
      password = [];
    }
    const pdfAlgorithm = revision === 6 ? new PDF20() : new PDF17();
    if (pdfAlgorithm.checkUserPassword(password, userValidationSalt, userPassword)) {
      return pdfAlgorithm.getUserKey(password, userKeySalt, userEncryption);
    } else if (password.length && pdfAlgorithm.checkOwnerPassword(password, ownerValidationSalt, uBytes, ownerPassword)) {
      return pdfAlgorithm.getOwnerKey(password, ownerKeySalt, uBytes, ownerEncryption);
    }
    return null;
  }
  #prepareKeyData(fileId, password, ownerPassword, userPassword, flags, revision, keyLength, encryptMetadata) {
    const hashDataSize = 40 + ownerPassword.length + fileId.length;
    const hashData = new Uint8Array(hashDataSize);
    let i = 0,
      j,
      n;
    if (password) {
      n = Math.min(32, password.length);
      for (; i < n; ++i) {
        hashData[i] = password[i];
      }
    }
    j = 0;
    while (i < 32) {
      hashData[i++] = CipherTransformFactory._defaultPasswordBytes[j++];
    }
    hashData.set(ownerPassword, i);
    i += ownerPassword.length;
    hashData[i++] = flags & 0xff;
    hashData[i++] = flags >> 8 & 0xff;
    hashData[i++] = flags >> 16 & 0xff;
    hashData[i++] = flags >>> 24 & 0xff;
    hashData.set(fileId, i);
    i += fileId.length;
    if (revision >= 4 && !encryptMetadata) {
      hashData.fill(0xff, i, i + 4);
      i += 4;
    }
    let hash = calculateMD5(hashData, 0, i);
    const keyLengthInBytes = keyLength >> 3;
    if (revision >= 3) {
      for (j = 0; j < 50; ++j) {
        hash = calculateMD5(hash, 0, keyLengthInBytes);
      }
    }
    const encryptionKey = hash.subarray(0, keyLengthInBytes);
    let cipher, checkData;
    if (revision >= 3) {
      i = 0;
      hashData.set(CipherTransformFactory._defaultPasswordBytes, i);
      i += 32;
      hashData.set(fileId, i);
      i += fileId.length;
      cipher = new ARCFourCipher(encryptionKey);
      checkData = cipher.encryptBlock(calculateMD5(hashData, 0, i));
      n = encryptionKey.length;
      const derivedKey = new Uint8Array(n);
      for (j = 1; j <= 19; ++j) {
        for (let k = 0; k < n; ++k) {
          derivedKey[k] = encryptionKey[k] ^ j;
        }
        cipher = new ARCFourCipher(derivedKey);
        checkData = cipher.encryptBlock(checkData);
      }
    } else {
      cipher = new ARCFourCipher(encryptionKey);
      checkData = cipher.encryptBlock(CipherTransformFactory._defaultPasswordBytes);
    }
    return checkData.every((data, k) => userPassword[k] === data) ? encryptionKey : null;
  }
  #decodeUserPassword(password, ownerPassword, revision, keyLength) {
    const hashData = new Uint8Array(32);
    let i = 0;
    const n = Math.min(32, password.length);
    for (; i < n; ++i) {
      hashData[i] = password[i];
    }
    let j = 0;
    while (i < 32) {
      hashData[i++] = CipherTransformFactory._defaultPasswordBytes[j++];
    }
    let hash = calculateMD5(hashData, 0, i);
    const keyLengthInBytes = keyLength >> 3;
    if (revision >= 3) {
      for (j = 0; j < 50; ++j) {
        hash = calculateMD5(hash, 0, hash.length);
      }
    }
    let cipher, userPassword;
    if (revision >= 3) {
      userPassword = ownerPassword;
      const derivedKey = new Uint8Array(keyLengthInBytes);
      for (j = 19; j >= 0; j--) {
        for (let k = 0; k < keyLengthInBytes; ++k) {
          derivedKey[k] = hash[k] ^ j;
        }
        cipher = new ARCFourCipher(derivedKey);
        userPassword = cipher.encryptBlock(userPassword);
      }
    } else {
      cipher = new ARCFourCipher(hash.subarray(0, keyLengthInBytes));
      userPassword = cipher.encryptBlock(ownerPassword);
    }
    return userPassword;
  }
  #buildObjectKey(num, gen, encryptionKey, isAes = false) {
    const n = encryptionKey.length;
    const key = new Uint8Array(n + 9);
    key.set(encryptionKey);
    let i = n;
    key[i++] = num & 0xff;
    key[i++] = num >> 8 & 0xff;
    key[i++] = num >> 16 & 0xff;
    key[i++] = gen & 0xff;
    key[i++] = gen >> 8 & 0xff;
    if (isAes) {
      key[i++] = 0x73;
      key[i++] = 0x41;
      key[i++] = 0x6c;
      key[i++] = 0x54;
    }
    const hash = calculateMD5(key, 0, i);
    return hash.subarray(0, Math.min(n + 5, 16));
  }
  #buildCipherConstructor(cf, name, num, gen, key) {
    if (!(name instanceof Name)) {
      throw new FormatError("Invalid crypt filter name.");
    }
    const self = this;
    const cryptFilter = cf.get(name.name);
    const cfm = cryptFilter?.get("CFM");
    if (!cfm || cfm.name === "None") {
      return function () {
        return new NullCipher();
      };
    }
    if (cfm.name === "V2") {
      return function () {
        return new ARCFourCipher(self.#buildObjectKey(num, gen, key, false));
      };
    }
    if (cfm.name === "AESV2") {
      return function () {
        return new AES128Cipher(self.#buildObjectKey(num, gen, key, true));
      };
    }
    if (cfm.name === "AESV3") {
      return function () {
        return new AES256Cipher(key);
      };
    }
    throw new FormatError("Unknown crypto method");
  }
  constructor(dict, fileId, password) {
    const filter = dict.get("Filter");
    if (!isName(filter, "Standard")) {
      throw new FormatError("unknown encryption method");
    }
    this.filterName = filter.name;
    this.dict = dict;
    const algorithm = dict.get("V");
    if (!Number.isInteger(algorithm) || algorithm !== 1 && algorithm !== 2 && algorithm !== 4 && algorithm !== 5) {
      throw new FormatError("unsupported encryption algorithm");
    }
    this.algorithm = algorithm;
    let keyLength = dict.get("Length");
    if (!keyLength) {
      if (algorithm <= 3) {
        keyLength = 40;
      } else {
        const cfDict = dict.get("CF");
        const streamCryptoName = dict.get("StmF");
        if (cfDict instanceof Dict && streamCryptoName instanceof Name) {
          cfDict.suppressEncryption = true;
          const handlerDict = cfDict.get(streamCryptoName.name);
          keyLength = handlerDict?.get("Length") || 128;
          if (keyLength < 40) {
            keyLength <<= 3;
          }
        }
      }
    }
    if (!Number.isInteger(keyLength) || keyLength < 40 || keyLength % 8 !== 0) {
      throw new FormatError("invalid key length");
    }
    const ownerBytes = stringToBytes(dict.get("O")),
      userBytes = stringToBytes(dict.get("U"));
    const ownerPassword = ownerBytes.subarray(0, 32);
    const userPassword = userBytes.subarray(0, 32);
    const flags = dict.get("P");
    const revision = dict.get("R");
    const encryptMetadata = (algorithm === 4 || algorithm === 5) && dict.get("EncryptMetadata") !== false;
    this.encryptMetadata = encryptMetadata;
    const fileIdBytes = stringToBytes(fileId);
    let passwordBytes;
    if (password) {
      if (revision === 6) {
        try {
          password = utf8StringToString(password);
        } catch {
          warn("CipherTransformFactory: Unable to convert UTF8 encoded password.");
        }
      }
      passwordBytes = stringToBytes(password);
    }
    let encryptionKey;
    if (algorithm !== 5) {
      encryptionKey = this.#prepareKeyData(fileIdBytes, passwordBytes, ownerPassword, userPassword, flags, revision, keyLength, encryptMetadata);
    } else {
      const ownerValidationSalt = ownerBytes.subarray(32, 40);
      const ownerKeySalt = ownerBytes.subarray(40, 48);
      const uBytes = userBytes.subarray(0, 48);
      const userValidationSalt = userBytes.subarray(32, 40);
      const userKeySalt = userBytes.subarray(40, 48);
      const ownerEncryption = stringToBytes(dict.get("OE"));
      const userEncryption = stringToBytes(dict.get("UE"));
      const perms = stringToBytes(dict.get("Perms"));
      encryptionKey = this.#createEncryptionKey20(revision, passwordBytes, ownerPassword, ownerValidationSalt, ownerKeySalt, uBytes, userPassword, userValidationSalt, userKeySalt, ownerEncryption, userEncryption, perms);
    }
    if (!encryptionKey) {
      if (!password) {
        throw new PasswordException("No password given", PasswordResponses.NEED_PASSWORD);
      }
      const decodedPassword = this.#decodeUserPassword(passwordBytes, ownerPassword, revision, keyLength);
      encryptionKey = this.#prepareKeyData(fileIdBytes, decodedPassword, ownerPassword, userPassword, flags, revision, keyLength, encryptMetadata);
    }
    if (!encryptionKey) {
      throw new PasswordException("Incorrect Password", PasswordResponses.INCORRECT_PASSWORD);
    }
    if (algorithm === 4 && encryptionKey.length < 16) {
      this.encryptionKey = new Uint8Array(16);
      this.encryptionKey.set(encryptionKey);
    } else {
      this.encryptionKey = encryptionKey;
    }
    if (algorithm >= 4) {
      const cf = dict.get("CF");
      if (cf instanceof Dict) {
        cf.suppressEncryption = true;
      }
      this.cf = cf;
      this.stmf = dict.get("StmF") || Name.get("Identity");
      this.strf = dict.get("StrF") || Name.get("Identity");
      this.eff = dict.get("EFF") || this.stmf;
    }
  }
  createCipherTransform(num, gen) {
    if (this.algorithm === 4 || this.algorithm === 5) {
      return new CipherTransform(this.#buildCipherConstructor(this.cf, this.strf, num, gen, this.encryptionKey), this.#buildCipherConstructor(this.cf, this.stmf, num, gen, this.encryptionKey));
    }
    const key = this.#buildObjectKey(num, gen, this.encryptionKey, false);
    const cipherConstructor = function () {
      return new ARCFourCipher(key);
    };
    return new CipherTransform(cipherConstructor, cipherConstructor);
  }
}

;// ./src/core/xref.js





















class XRef {
  #firstXRefStmPos = null;
  constructor(stream, pdfManager) {
    this.stream = stream;
    this.pdfManager = pdfManager;
    this.entries = [];
    this._xrefStms = new Set();
    this._cacheMap = new Map();
    this._pendingRefs = new RefSet();
    this._newPersistentRefNum = null;
    this._newTemporaryRefNum = null;
    this._persistentRefsCache = null;
  }
  getNewPersistentRef(obj) {
    if (this._newPersistentRefNum === null) {
      this._newPersistentRefNum = this.entries.length || 1;
    }
    const num = this._newPersistentRefNum++;
    this._cacheMap.set(num, obj);
    return Ref.get(num, 0);
  }
  getNewTemporaryRef() {
    if (this._newTemporaryRefNum === null) {
      this._newTemporaryRefNum = this.entries.length || 1;
      if (this._newPersistentRefNum) {
        this._persistentRefsCache = new Map();
        for (let i = this._newTemporaryRefNum; i < this._newPersistentRefNum; i++) {
          this._persistentRefsCache.set(i, this._cacheMap.get(i));
          this._cacheMap.delete(i);
        }
      }
    }
    return Ref.get(this._newTemporaryRefNum++, 0);
  }
  resetNewTemporaryRef() {
    this._newTemporaryRefNum = null;
    if (this._persistentRefsCache) {
      for (const [num, obj] of this._persistentRefsCache) {
        this._cacheMap.set(num, obj);
      }
    }
    this._persistentRefsCache = null;
  }
  setStartXRef(startXRef) {
    this.startXRefQueue = [startXRef];
  }
  parse(recoveryMode = false) {
    let trailerDict;
    if (!recoveryMode) {
      trailerDict = this.readXRef();
    } else {
      warn("Indexing all PDF objects");
      trailerDict = this.indexObjects();
    }
    trailerDict.assignXref(this);
    this.trailer = trailerDict;
    let encrypt;
    try {
      encrypt = trailerDict.get("Encrypt");
    } catch (ex) {
      if (ex instanceof MissingDataException) {
        throw ex;
      }
      warn(`XRef.parse - Invalid "Encrypt" reference: "${ex}".`);
    }
    if (encrypt instanceof Dict) {
      const ids = trailerDict.get("ID");
      const fileId = ids?.length ? ids[0] : "";
      encrypt.suppressEncryption = true;
      this.encrypt = new CipherTransformFactory(encrypt, fileId, this.pdfManager.password);
    }
    let root;
    try {
      root = trailerDict.get("Root");
    } catch (ex) {
      if (ex instanceof MissingDataException) {
        throw ex;
      }
      warn(`XRef.parse - Invalid "Root" reference: "${ex}".`);
    }
    if (root instanceof Dict) {
      try {
        const pages = root.get("Pages");
        if (pages instanceof Dict) {
          this.root = root;
          return;
        }
      } catch (ex) {
        if (ex instanceof MissingDataException) {
          throw ex;
        }
        warn(`XRef.parse - Invalid "Pages" reference: "${ex}".`);
      }
    }
    if (!recoveryMode) {
      throw new XRefParseException();
    }
    throw new InvalidPDFException("Invalid Root reference.");
  }
  processXRefTable(parser) {
    if (!("tableState" in this)) {
      this.tableState = {
        entryNum: 0,
        streamPos: parser.lexer.stream.pos,
        parserBuf1: parser.buf1,
        parserBuf2: parser.buf2
      };
    }
    const obj = this.readXRefTable(parser);
    if (!isCmd(obj, "trailer")) {
      throw new FormatError("Invalid XRef table: could not find trailer dictionary");
    }
    let dict = parser.getObj();
    if (!(dict instanceof Dict) && dict.dict) {
      dict = dict.dict;
    }
    if (!(dict instanceof Dict)) {
      throw new FormatError("Invalid XRef table: could not parse trailer dictionary");
    }
    delete this.tableState;
    return dict;
  }
  readXRefTable(parser) {
    const stream = parser.lexer.stream;
    const tableState = this.tableState;
    stream.pos = tableState.streamPos;
    parser.buf1 = tableState.parserBuf1;
    parser.buf2 = tableState.parserBuf2;
    let obj;
    while (true) {
      if (!("firstEntryNum" in tableState) || !("entryCount" in tableState)) {
        if (isCmd(obj = parser.getObj(), "trailer")) {
          break;
        }
        tableState.firstEntryNum = obj;
        tableState.entryCount = parser.getObj();
      }
      let first = tableState.firstEntryNum;
      const count = tableState.entryCount;
      if (!Number.isInteger(first) || !Number.isInteger(count)) {
        throw new FormatError("Invalid XRef table: wrong types in subsection header");
      }
      for (let i = tableState.entryNum; i < count; i++) {
        tableState.streamPos = stream.pos;
        tableState.entryNum = i;
        tableState.parserBuf1 = parser.buf1;
        tableState.parserBuf2 = parser.buf2;
        const entry = {};
        entry.offset = parser.getObj();
        entry.gen = parser.getObj();
        const type = parser.getObj();
        if (type instanceof Cmd) {
          switch (type.cmd) {
            case "f":
              entry.free = true;
              break;
            case "n":
              entry.uncompressed = true;
              break;
          }
        }
        if (!Number.isInteger(entry.offset) || !Number.isInteger(entry.gen) || !(entry.free || entry.uncompressed)) {
          throw new FormatError(`Invalid entry in XRef subsection: ${first}, ${count}`);
        }
        if (i === 0 && entry.free && first === 1) {
          first = 0;
        }
        if (!this.entries[i + first]) {
          this.entries[i + first] = entry;
        }
      }
      tableState.entryNum = 0;
      tableState.streamPos = stream.pos;
      tableState.parserBuf1 = parser.buf1;
      tableState.parserBuf2 = parser.buf2;
      delete tableState.firstEntryNum;
      delete tableState.entryCount;
    }
    if (this.entries[0] && !this.entries[0].free) {
      throw new FormatError("Invalid XRef table: unexpected first object");
    }
    return obj;
  }
  processXRefStream(stream) {
    if (!("streamState" in this)) {
      const {
        dict,
        pos
      } = stream;
      const byteWidths = dict.get("W");
      const range = dict.get("Index") || [0, dict.get("Size")];
      this.streamState = {
        entryRanges: range,
        byteWidths,
        entryNum: 0,
        streamPos: pos
      };
    }
    this.readXRefStream(stream);
    delete this.streamState;
    return stream.dict;
  }
  readXRefStream(stream) {
    const streamState = this.streamState;
    stream.pos = streamState.streamPos;
    const [typeFieldWidth, offsetFieldWidth, generationFieldWidth] = streamState.byteWidths;
    const entryRanges = streamState.entryRanges;
    while (entryRanges.length > 0) {
      const [first, n] = entryRanges;
      if (!Number.isInteger(first) || !Number.isInteger(n)) {
        throw new FormatError(`Invalid XRef range fields: ${first}, ${n}`);
      }
      if (!Number.isInteger(typeFieldWidth) || !Number.isInteger(offsetFieldWidth) || !Number.isInteger(generationFieldWidth)) {
        throw new FormatError(`Invalid XRef entry fields length: ${first}, ${n}`);
      }
      for (let i = streamState.entryNum; i < n; ++i) {
        streamState.entryNum = i;
        streamState.streamPos = stream.pos;
        let type = 0,
          offset = 0,
          generation = 0;
        for (let j = 0; j < typeFieldWidth; ++j) {
          const typeByte = stream.getByte();
          if (typeByte === -1) {
            throw new FormatError("Invalid XRef byteWidths 'type'.");
          }
          type = type << 8 | typeByte;
        }
        if (typeFieldWidth === 0) {
          type = 1;
        }
        for (let j = 0; j < offsetFieldWidth; ++j) {
          const offsetByte = stream.getByte();
          if (offsetByte === -1) {
            throw new FormatError("Invalid XRef byteWidths 'offset'.");
          }
          offset = offset << 8 | offsetByte;
        }
        for (let j = 0; j < generationFieldWidth; ++j) {
          const generationByte = stream.getByte();
          if (generationByte === -1) {
            throw new FormatError("Invalid XRef byteWidths 'generation'.");
          }
          generation = generation << 8 | generationByte;
        }
        const entry = {};
        entry.offset = offset;
        entry.gen = generation;
        switch (type) {
          case 0:
            entry.free = true;
            break;
          case 1:
            entry.uncompressed = true;
            break;
          case 2:
            break;
          default:
            throw new FormatError(`Invalid XRef entry type: ${type}`);
        }
        if (!this.entries[first + i]) {
          this.entries[first + i] = entry;
        }
      }
      streamState.entryNum = 0;
      streamState.streamPos = stream.pos;
      entryRanges.splice(0, 2);
    }
  }
  indexObjects() {
    const TAB = 0x9,
      LF = 0xa,
      CR = 0xd,
      SPACE = 0x20;
    const PERCENT = 0x25,
      LT = 0x3c;
    function readToken(data, offset) {
      let token = "",
        ch = data[offset];
      while (ch !== LF && ch !== CR && ch !== LT) {
        if (++offset >= data.length) {
          break;
        }
        token += String.fromCharCode(ch);
        ch = data[offset];
      }
      return token;
    }
    function skipUntil(data, offset, what) {
      const length = what.length,
        dataLength = data.length;
      let skipped = 0;
      while (offset < dataLength) {
        let i = 0;
        while (i < length && data[offset + i] === what[i]) {
          ++i;
        }
        if (i >= length) {
          break;
        }
        offset++;
        skipped++;
      }
      return skipped;
    }
    const gEndobjRegExp = /\b(endobj|\d+\s+\d+\s+obj|xref|trailer\s*<<)\b/g;
    const gStartxrefRegExp = /\b(startxref|\d+\s+\d+\s+obj)\b/g;
    const objRegExp = /^(\d+)\s+(\d+)\s+obj\b/;
    const trailerBytes = new Uint8Array([116, 114, 97, 105, 108, 101, 114]);
    const startxrefBytes = new Uint8Array([115, 116, 97, 114, 116, 120, 114, 101, 102]);
    const xrefBytes = new Uint8Array([47, 88, 82, 101, 102]);
    this.entries.length = 0;
    this._cacheMap.clear();
    const stream = this.stream;
    stream.pos = 0;
    const buffer = stream.getBytes(),
      bufferStr = bytesToString(buffer),
      length = buffer.length;
    let position = stream.start;
    const trailers = [],
      xrefStms = [];
    while (position < length) {
      let ch = buffer[position];
      if (ch === TAB || ch === LF || ch === CR || ch === SPACE) {
        ++position;
        continue;
      }
      if (ch === PERCENT) {
        do {
          ++position;
          if (position >= length) {
            break;
          }
          ch = buffer[position];
        } while (ch !== LF && ch !== CR);
        continue;
      }
      const token = readToken(buffer, position);
      let m;
      if (token.startsWith("xref") && (token.length === 4 || /\s/.test(token[4]))) {
        position += skipUntil(buffer, position, trailerBytes);
        trailers.push(position);
        position += skipUntil(buffer, position, startxrefBytes);
      } else if (m = objRegExp.exec(token)) {
        const num = m[1] | 0,
          gen = m[2] | 0;
        const startPos = position + token.length;
        let contentLength,
          updateEntries = false;
        if (!this.entries[num]) {
          updateEntries = true;
        } else if (this.entries[num].gen === gen) {
          try {
            const parser = new Parser({
              lexer: new Lexer(stream.makeSubStream(startPos))
            });
            parser.getObj();
            updateEntries = true;
          } catch (ex) {
            if (ex instanceof ParserEOFException) {
              warn(`indexObjects -- checking object (${token}): "${ex}".`);
            } else {
              updateEntries = true;
            }
          }
        }
        if (updateEntries) {
          this.entries[num] = {
            offset: position - stream.start,
            gen,
            uncompressed: true
          };
        }
        gEndobjRegExp.lastIndex = startPos;
        const match = gEndobjRegExp.exec(bufferStr);
        if (match) {
          const endPos = gEndobjRegExp.lastIndex + 1;
          contentLength = endPos - position;
          if (match[1] !== "endobj") {
            warn(`indexObjects: Found "${match[1]}" inside of another "obj", ` + 'caused by missing "endobj" -- trying to recover.');
            contentLength -= match[1].length + 1;
          }
        } else {
          contentLength = length - position;
        }
        const content = buffer.subarray(position, position + contentLength);
        const xrefTagOffset = skipUntil(content, 0, xrefBytes);
        if (xrefTagOffset < contentLength && content[xrefTagOffset + 5] < 64) {
          xrefStms.push(position - stream.start);
          this._xrefStms.add(position - stream.start);
        }
        position += contentLength;
      } else if (token.startsWith("trailer") && (token.length === 7 || /\s/.test(token[7]))) {
        trailers.push(position);
        const startPos = position + token.length;
        let contentLength;
        gStartxrefRegExp.lastIndex = startPos;
        const match = gStartxrefRegExp.exec(bufferStr);
        if (match) {
          const endPos = gStartxrefRegExp.lastIndex + 1;
          contentLength = endPos - position;
          if (match[1] !== "startxref") {
            warn(`indexObjects: Found "${match[1]}" after "trailer", ` + 'caused by missing "startxref" -- trying to recover.');
            contentLength -= match[1].length + 1;
          }
        } else {
          contentLength = length - position;
        }
        position += contentLength;
      } else {
        position += token.length + 1;
      }
    }
    for (const xrefStm of xrefStms) {
      this.startXRefQueue.push(xrefStm);
      this.readXRef(true);
    }
    const trailerDicts = [];
    let isEncrypted = false;
    for (const trailer of trailers) {
      stream.pos = trailer;
      const parser = new Parser({
        lexer: new Lexer(stream),
        xref: this,
        allowStreams: true,
        recoveryMode: true
      });
      const obj = parser.getObj();
      if (!isCmd(obj, "trailer")) {
        continue;
      }
      const dict = parser.getObj();
      if (!(dict instanceof Dict)) {
        continue;
      }
      trailerDicts.push(dict);
      if (dict.has("Encrypt")) {
        isEncrypted = true;
      }
    }
    let trailerDict, trailerError;
    for (const dict of [...trailerDicts, "genFallback", ...trailerDicts]) {
      if (dict === "genFallback") {
        if (!trailerError) {
          break;
        }
        this._generationFallback = true;
        continue;
      }
      let validPagesDict = false;
      try {
        const rootDict = dict.get("Root");
        if (!(rootDict instanceof Dict)) {
          continue;
        }
        const pagesDict = rootDict.get("Pages");
        if (!(pagesDict instanceof Dict)) {
          continue;
        }
        const pagesCount = pagesDict.get("Count");
        if (Number.isInteger(pagesCount)) {
          validPagesDict = true;
        }
      } catch (ex) {
        trailerError = ex;
        continue;
      }
      if (validPagesDict && (!isEncrypted || dict.has("Encrypt")) && dict.has("ID")) {
        return dict;
      }
      trailerDict = dict;
    }
    if (trailerDict) {
      return trailerDict;
    }
    if (this.topDict) {
      return this.topDict;
    }
    if (!trailerDicts.length) {
      for (const [num, entry] of this.entries.entries()) {
        if (!entry) {
          continue;
        }
        const ref = Ref.get(num, entry.gen);
        let obj;
        try {
          obj = this.fetch(ref);
        } catch {
          continue;
        }
        if (obj instanceof BaseStream) {
          obj = obj.dict;
        }
        if (obj instanceof Dict && obj.has("Root")) {
          return obj;
        }
      }
    }
    throw new InvalidPDFException("Invalid PDF structure.");
  }
  readXRef(recoveryMode = false) {
    const stream = this.stream;
    const startXRefParsedCache = new Set();
    while (this.startXRefQueue.length) {
      try {
        const startXRef = this.startXRefQueue[0];
        if (startXRefParsedCache.has(startXRef)) {
          warn("readXRef - skipping XRef table since it was already parsed.");
          this.startXRefQueue.shift();
          continue;
        }
        startXRefParsedCache.add(startXRef);
        stream.pos = startXRef + stream.start;
        const parser = new Parser({
          lexer: new Lexer(stream),
          xref: this,
          allowStreams: true
        });
        let obj = parser.getObj();
        let dict;
        if (isCmd(obj, "xref")) {
          dict = this.processXRefTable(parser);
          if (!this.topDict) {
            this.topDict = dict;
          }
          obj = dict.get("XRefStm");
          if (Number.isInteger(obj) && !this._xrefStms.has(obj)) {
            this._xrefStms.add(obj);
            this.startXRefQueue.push(obj);
            this.#firstXRefStmPos ??= obj;
          }
        } else if (Number.isInteger(obj)) {
          if (!Number.isInteger(parser.getObj()) || !isCmd(parser.getObj(), "obj") || !((obj = parser.getObj()) instanceof BaseStream)) {
            throw new FormatError("Invalid XRef stream");
          }
          dict = this.processXRefStream(obj);
          if (!this.topDict) {
            this.topDict = dict;
          }
          if (!dict) {
            throw new FormatError("Failed to read XRef stream");
          }
        } else {
          throw new FormatError("Invalid XRef stream header");
        }
        obj = dict.get("Prev");
        if (Number.isInteger(obj)) {
          this.startXRefQueue.push(obj);
        } else if (obj instanceof Ref) {
          this.startXRefQueue.push(obj.num);
        }
      } catch (e) {
        if (e instanceof MissingDataException) {
          throw e;
        }
        info("(while reading XRef): " + e);
      }
      this.startXRefQueue.shift();
    }
    if (this.topDict) {
      return this.topDict;
    }
    if (recoveryMode) {
      return undefined;
    }
    throw new XRefParseException();
  }
  get lastXRefStreamPos() {
    return this.#firstXRefStmPos ?? (this._xrefStms.size > 0 ? Math.max(...this._xrefStms) : null);
  }
  getEntry(i) {
    const xrefEntry = this.entries[i];
    if (xrefEntry && !xrefEntry.free && xrefEntry.offset) {
      return xrefEntry;
    }
    return null;
  }
  fetchIfRef(obj, suppressEncryption = false) {
    if (obj instanceof Ref) {
      return this.fetch(obj, suppressEncryption);
    }
    return obj;
  }
  fetch(ref, suppressEncryption = false) {
    if (!(ref instanceof Ref)) {
      throw new Error("ref object is not a reference");
    }
    const num = ref.num;
    const cacheEntry = this._cacheMap.get(num);
    if (cacheEntry !== undefined) {
      if (cacheEntry instanceof Dict && !cacheEntry.objId) {
        cacheEntry.objId = ref.toString();
      }
      return cacheEntry;
    }
    let xrefEntry = this.getEntry(num);
    if (xrefEntry === null) {
      return xrefEntry;
    }
    if (this._pendingRefs.has(ref)) {
      this._pendingRefs.remove(ref);
      warn(`Ignoring circular reference: ${ref}.`);
      return CIRCULAR_REF;
    }
    this._pendingRefs.put(ref);
    try {
      xrefEntry = xrefEntry.uncompressed ? this.fetchUncompressed(ref, xrefEntry, suppressEncryption) : this.fetchCompressed(ref, xrefEntry, suppressEncryption);
      this._pendingRefs.remove(ref);
    } catch (ex) {
      this._pendingRefs.remove(ref);
      throw ex;
    }
    if (xrefEntry instanceof Dict) {
      xrefEntry.objId = ref.toString();
    } else if (xrefEntry instanceof BaseStream) {
      xrefEntry.dict.objId = ref.toString();
    }
    return xrefEntry;
  }
  fetchUncompressed(ref, xrefEntry, suppressEncryption = false) {
    const gen = ref.gen;
    let num = ref.num;
    if (xrefEntry.gen !== gen) {
      const msg = `Inconsistent generation in XRef: ${ref}`;
      if (this._generationFallback && xrefEntry.gen < gen) {
        warn(msg);
        return this.fetchUncompressed(Ref.get(num, xrefEntry.gen), xrefEntry, suppressEncryption);
      }
      throw new XRefEntryException(msg);
    }
    const stream = this.stream.makeSubStream(xrefEntry.offset + this.stream.start);
    const parser = new Parser({
      lexer: new Lexer(stream),
      xref: this,
      allowStreams: true
    });
    const obj1 = parser.getObj();
    const obj2 = parser.getObj();
    const obj3 = parser.getObj();
    if (obj1 !== num || obj2 !== gen || !(obj3 instanceof Cmd)) {
      throw new XRefEntryException(`Bad (uncompressed) XRef entry: ${ref}`);
    }
    if (obj3.cmd !== "obj") {
      if (obj3.cmd.startsWith("obj")) {
        num = parseInt(obj3.cmd.substring(3), 10);
        if (!Number.isNaN(num)) {
          return num;
        }
      }
      throw new XRefEntryException(`Bad (uncompressed) XRef entry: ${ref}`);
    }
    xrefEntry = this.encrypt && !suppressEncryption ? parser.getObj(this.encrypt.createCipherTransform(num, gen)) : parser.getObj();
    if (!(xrefEntry instanceof BaseStream)) {
      this._cacheMap.set(num, xrefEntry);
    }
    return xrefEntry;
  }
  fetchCompressed(ref, xrefEntry, suppressEncryption = false) {
    const tableOffset = xrefEntry.offset;
    const stream = this.fetch(Ref.get(tableOffset, 0));
    if (!(stream instanceof BaseStream)) {
      throw new FormatError("bad ObjStm stream");
    }
    const first = stream.dict.get("First");
    const n = stream.dict.get("N");
    if (!Number.isInteger(first) || !Number.isInteger(n)) {
      throw new FormatError("invalid first and n parameters for ObjStm stream");
    }
    let parser = new Parser({
      lexer: new Lexer(stream),
      xref: this,
      allowStreams: true
    });
    const nums = new Array(n);
    const offsets = new Array(n);
    for (let i = 0; i < n; ++i) {
      const num = parser.getObj();
      if (!Number.isInteger(num)) {
        throw new FormatError(`invalid object number in the ObjStm stream: ${num}`);
      }
      const offset = parser.getObj();
      if (!Number.isInteger(offset)) {
        throw new FormatError(`invalid object offset in the ObjStm stream: ${offset}`);
      }
      nums[i] = num;
      offsets[i] = offset;
    }
    const start = (stream.start || 0) + first;
    const entries = new Array(n);
    for (let i = 0; i < n; ++i) {
      const length = i < n - 1 ? offsets[i + 1] - offsets[i] : undefined;
      if (length < 0) {
        throw new FormatError("Invalid offset in the ObjStm stream.");
      }
      parser = new Parser({
        lexer: new Lexer(stream.makeSubStream(start + offsets[i], length, stream.dict)),
        xref: this,
        allowStreams: true
      });
      const obj = parser.getObj();
      entries[i] = obj;
      if (obj instanceof BaseStream) {
        continue;
      }
      const num = nums[i],
        entry = this.entries[num];
      if (entry && entry.offset === tableOffset && entry.gen === i) {
        this._cacheMap.set(num, obj);
      }
    }
    xrefEntry = entries[xrefEntry.gen];
    if (xrefEntry === undefined) {
      throw new XRefEntryException(`Bad (compressed) XRef entry: ${ref}`);
    }
    return xrefEntry;
  }
  async fetchIfRefAsync(obj, suppressEncryption) {
    if (obj instanceof Ref) {
      return this.fetchAsync(obj, suppressEncryption);
    }
    return obj;
  }
  async fetchAsync(ref, suppressEncryption) {
    try {
      return this.fetch(ref, suppressEncryption);
    } catch (ex) {
      if (!(ex instanceof MissingDataException)) {
        throw ex;
      }
      await this.pdfManager.requestRange(ex.begin, ex.end);
      return this.fetchAsync(ref, suppressEncryption);
    }
  }
  getCatalogObj() {
    return this.root;
  }
}

;// ./src/core/document.js






































const LETTER_SIZE_MEDIABOX = [0, 0, 612, 792];
class Page {
  #resourcesPromise = null;
  constructor({
    pdfManager,
    xref,
    pageIndex,
    pageDict,
    ref,
    globalIdFactory,
    fontCache,
    builtInCMapCache,
    standardFontDataCache,
    globalColorSpaceCache,
    globalImageCache,
    systemFontCache,
    nonBlendModesSet,
    xfaFactory
  }) {
    this.pdfManager = pdfManager;
    this.pageIndex = pageIndex;
    this.pageDict = pageDict;
    this.xref = xref;
    this.ref = ref;
    this.fontCache = fontCache;
    this.builtInCMapCache = builtInCMapCache;
    this.standardFontDataCache = standardFontDataCache;
    this.globalColorSpaceCache = globalColorSpaceCache;
    this.globalImageCache = globalImageCache;
    this.systemFontCache = systemFontCache;
    this.nonBlendModesSet = nonBlendModesSet;
    this.evaluatorOptions = pdfManager.evaluatorOptions;
    this.xfaFactory = xfaFactory;
    const idCounters = {
      obj: 0
    };
    this._localIdFactory = class extends globalIdFactory {
      static createObjId() {
        return `p${pageIndex}_${++idCounters.obj}`;
      }
      static getPageObjId() {
        return `p${ref.toString()}`;
      }
    };
  }
  #createPartialEvaluator(handler) {
    return new PartialEvaluator({
      xref: this.xref,
      handler,
      pageIndex: this.pageIndex,
      idFactory: this._localIdFactory,
      fontCache: this.fontCache,
      builtInCMapCache: this.builtInCMapCache,
      standardFontDataCache: this.standardFontDataCache,
      globalColorSpaceCache: this.globalColorSpaceCache,
      globalImageCache: this.globalImageCache,
      systemFontCache: this.systemFontCache,
      options: this.evaluatorOptions
    });
  }
  #getInheritableProperty(key, getArray = false) {
    const value = getInheritableProperty({
      dict: this.pageDict,
      key,
      getArray,
      stopWhenFound: false
    });
    if (!Array.isArray(value)) {
      return value;
    }
    if (value.length === 1 || !(value[0] instanceof Dict)) {
      return value[0];
    }
    return Dict.merge({
      xref: this.xref,
      dictArray: value
    });
  }
  get content() {
    return this.pageDict.getArray("Contents");
  }
  get resources() {
    const resources = this.#getInheritableProperty("Resources");
    return shadow(this, "resources", resources instanceof Dict ? resources : Dict.empty);
  }
  #getBoundingBox(name) {
    if (this.xfaData) {
      return this.xfaData.bbox;
    }
    const box = lookupNormalRect(this.#getInheritableProperty(name, true), null);
    if (box) {
      if (box[2] - box[0] > 0 && box[3] - box[1] > 0) {
        return box;
      }
      warn(`Empty, or invalid, /${name} entry.`);
    }
    return null;
  }
  get mediaBox() {
    return shadow(this, "mediaBox", this.#getBoundingBox("MediaBox") || LETTER_SIZE_MEDIABOX);
  }
  get cropBox() {
    return shadow(this, "cropBox", this.#getBoundingBox("CropBox") || this.mediaBox);
  }
  get userUnit() {
    const obj = this.pageDict.get("UserUnit");
    return shadow(this, "userUnit", typeof obj === "number" && obj > 0 ? obj : 1.0);
  }
  get view() {
    const {
      cropBox,
      mediaBox
    } = this;
    if (cropBox !== mediaBox && !isArrayEqual(cropBox, mediaBox)) {
      const box = Util.intersect(cropBox, mediaBox);
      if (box && box[2] - box[0] > 0 && box[3] - box[1] > 0) {
        return shadow(this, "view", box);
      }
      warn("Empty /CropBox and /MediaBox intersection.");
    }
    return shadow(this, "view", mediaBox);
  }
  get rotate() {
    let rotate = this.#getInheritableProperty("Rotate") || 0;
    if (rotate % 90 !== 0) {
      rotate = 0;
    } else if (rotate >= 360) {
      rotate %= 360;
    } else if (rotate < 0) {
      rotate = (rotate % 360 + 360) % 360;
    }
    return shadow(this, "rotate", rotate);
  }
  #onSubStreamError(reason, objId) {
    if (this.evaluatorOptions.ignoreErrors) {
      warn(`getContentStream - ignoring sub-stream (${objId}): "${reason}".`);
      return;
    }
    throw reason;
  }
  async getContentStream() {
    const content = await this.pdfManager.ensure(this, "content");
    if (content instanceof BaseStream) {
      return content;
    }
    if (Array.isArray(content)) {
      return new StreamsSequenceStream(content, this.#onSubStreamError.bind(this));
    }
    return new NullStream();
  }
  get xfaData() {
    return shadow(this, "xfaData", this.xfaFactory ? {
      bbox: this.xfaFactory.getBoundingBox(this.pageIndex)
    } : null);
  }
  async #replaceIdByRef(annotations, deletedAnnotations, existingAnnotations) {
    const promises = [];
    for (const annotation of annotations) {
      if (annotation.id) {
        const ref = Ref.fromString(annotation.id);
        if (!ref) {
          warn(`A non-linked annotation cannot be modified: ${annotation.id}`);
          continue;
        }
        if (annotation.deleted) {
          deletedAnnotations.put(ref, ref);
          if (annotation.popupRef) {
            const popupRef = Ref.fromString(annotation.popupRef);
            if (popupRef) {
              deletedAnnotations.put(popupRef, popupRef);
            }
          }
          continue;
        }
        existingAnnotations?.put(ref);
        annotation.ref = ref;
        promises.push(this.xref.fetchAsync(ref).then(obj => {
          if (obj instanceof Dict) {
            annotation.oldAnnotation = obj.clone();
          }
        }, () => {
          warn(`Cannot fetch \`oldAnnotation\` for: ${ref}.`);
        }));
        delete annotation.id;
      }
    }
    await Promise.all(promises);
  }
  async saveNewAnnotations(handler, task, annotations, imagePromises, changes) {
    if (this.xfaFactory) {
      throw new Error("XFA: Cannot save new annotations.");
    }
    const partialEvaluator = this.#createPartialEvaluator(handler);
    const deletedAnnotations = new RefSetCache();
    const existingAnnotations = new RefSet();
    await this.#replaceIdByRef(annotations, deletedAnnotations, existingAnnotations);
    const pageDict = this.pageDict;
    const annotationsArray = this.annotations.filter(a => !(a instanceof Ref && deletedAnnotations.has(a)));
    const newData = await AnnotationFactory.saveNewAnnotations(partialEvaluator, task, annotations, imagePromises, changes);
    for (const {
      ref
    } of newData.annotations) {
      if (ref instanceof Ref && !existingAnnotations.has(ref)) {
        annotationsArray.push(ref);
      }
    }
    const dict = pageDict.clone();
    dict.set("Annots", annotationsArray);
    changes.put(this.ref, {
      data: dict
    });
    for (const deletedRef of deletedAnnotations) {
      changes.put(deletedRef, {
        data: null
      });
    }
  }
  async save(handler, task, annotationStorage, changes) {
    const partialEvaluator = this.#createPartialEvaluator(handler);
    const annotations = await this._parsedAnnotations;
    const promises = [];
    for (const annotation of annotations) {
      promises.push(annotation.save(partialEvaluator, task, annotationStorage, changes).catch(function (reason) {
        warn("save - ignoring annotation data during " + `"${task.name}" task: "${reason}".`);
        return null;
      }));
    }
    return Promise.all(promises);
  }
  async loadResources(keys) {
    await (this.#resourcesPromise ??= this.pdfManager.ensure(this, "resources"));
    await ObjectLoader.load(this.resources, keys, this.xref);
  }
  async #getMergedResources(streamDict, keys) {
    const localResources = streamDict?.get("Resources");
    if (!(localResources instanceof Dict && localResources.size)) {
      return this.resources;
    }
    await ObjectLoader.load(localResources, keys, this.xref);
    return Dict.merge({
      xref: this.xref,
      dictArray: [localResources, this.resources],
      mergeSubDicts: true
    });
  }
  async getOperatorList({
    handler,
    sink,
    task,
    intent,
    cacheKey,
    annotationStorage = null,
    modifiedIds = null
  }) {
    const contentStreamPromise = this.getContentStream();
    const resourcesPromise = this.loadResources(RESOURCES_KEYS_OPERATOR_LIST);
    const partialEvaluator = this.#createPartialEvaluator(handler);
    const newAnnotsByPage = !this.xfaFactory ? getNewAnnotationsMap(annotationStorage) : null;
    const newAnnots = newAnnotsByPage?.get(this.pageIndex);
    let newAnnotationsPromise = Promise.resolve(null);
    let deletedAnnotations = null;
    if (newAnnots) {
      const annotationGlobalsPromise = this.pdfManager.ensureDoc("annotationGlobals");
      let imagePromises;
      const missingBitmaps = new Set();
      for (const {
        bitmapId,
        bitmap
      } of newAnnots) {
        if (bitmapId && !bitmap && !missingBitmaps.has(bitmapId)) {
          missingBitmaps.add(bitmapId);
        }
      }
      const {
        isOffscreenCanvasSupported
      } = this.evaluatorOptions;
      if (missingBitmaps.size > 0) {
        const annotationWithBitmaps = newAnnots.slice();
        for (const [key, annotation] of annotationStorage) {
          if (!key.startsWith(AnnotationEditorPrefix)) {
            continue;
          }
          if (annotation.bitmap && missingBitmaps.has(annotation.bitmapId)) {
            annotationWithBitmaps.push(annotation);
          }
        }
        imagePromises = AnnotationFactory.generateImages(annotationWithBitmaps, this.xref, isOffscreenCanvasSupported);
      } else {
        imagePromises = AnnotationFactory.generateImages(newAnnots, this.xref, isOffscreenCanvasSupported);
      }
      deletedAnnotations = new RefSet();
      newAnnotationsPromise = Promise.all([annotationGlobalsPromise, this.#replaceIdByRef(newAnnots, deletedAnnotations, null)]).then(([annotationGlobals]) => {
        if (!annotationGlobals) {
          return null;
        }
        return AnnotationFactory.printNewAnnotations(annotationGlobals, partialEvaluator, task, newAnnots, imagePromises);
      });
    }
    const pageListPromise = Promise.all([contentStreamPromise, resourcesPromise]).then(async ([contentStream]) => {
      const resources = await this.#getMergedResources(contentStream.dict, RESOURCES_KEYS_OPERATOR_LIST);
      const opList = new OperatorList(intent, sink);
      handler.send("StartRenderPage", {
        transparency: partialEvaluator.hasBlendModes(resources, this.nonBlendModesSet),
        pageIndex: this.pageIndex,
        cacheKey
      });
      await partialEvaluator.getOperatorList({
        stream: contentStream,
        task,
        resources,
        operatorList: opList
      });
      return opList;
    });
    let [pageOpList, annotations, newAnnotations] = await Promise.all([pageListPromise, this._parsedAnnotations, newAnnotationsPromise]);
    if (newAnnotations) {
      annotations = annotations.filter(a => !(a.ref && deletedAnnotations.has(a.ref)));
      for (let i = 0, ii = newAnnotations.length; i < ii; i++) {
        const newAnnotation = newAnnotations[i];
        if (newAnnotation.refToReplace) {
          const j = annotations.findIndex(a => a.ref && isRefsEqual(a.ref, newAnnotation.refToReplace));
          if (j >= 0) {
            annotations.splice(j, 1, newAnnotation);
            newAnnotations.splice(i--, 1);
            ii--;
          }
        }
      }
      annotations = annotations.concat(newAnnotations);
    }
    if (annotations.length === 0 || intent & RenderingIntentFlag.ANNOTATIONS_DISABLE) {
      pageOpList.flush(true);
      return {
        length: pageOpList.totalLength
      };
    }
    const renderForms = !!(intent & RenderingIntentFlag.ANNOTATIONS_FORMS),
      isEditing = !!(intent & RenderingIntentFlag.IS_EDITING),
      intentAny = !!(intent & RenderingIntentFlag.ANY),
      intentDisplay = !!(intent & RenderingIntentFlag.DISPLAY),
      intentPrint = !!(intent & RenderingIntentFlag.PRINT);
    const opListPromises = [];
    for (const annotation of annotations) {
      if (intentAny || intentDisplay && annotation.mustBeViewed(annotationStorage, renderForms) && annotation.mustBeViewedWhenEditing(isEditing, modifiedIds) || intentPrint && annotation.mustBePrinted(annotationStorage)) {
        opListPromises.push(annotation.getOperatorList(partialEvaluator, task, intent, annotationStorage).catch(function (reason) {
          warn("getOperatorList - ignoring annotation data during " + `"${task.name}" task: "${reason}".`);
          return {
            opList: null,
            separateForm: false,
            separateCanvas: false
          };
        }));
      }
    }
    const opLists = await Promise.all(opListPromises);
    let form = false,
      canvas = false;
    for (const {
      opList,
      separateForm,
      separateCanvas
    } of opLists) {
      pageOpList.addOpList(opList);
      form ||= separateForm;
      canvas ||= separateCanvas;
    }
    pageOpList.flush(true, {
      form,
      canvas
    });
    return {
      length: pageOpList.totalLength
    };
  }
  async extractTextContent({
    handler,
    task,
    includeMarkedContent,
    disableNormalization,
    sink
  }) {
    const contentStreamPromise = this.getContentStream();
    const resourcesPromise = this.loadResources(RESOURCES_KEYS_TEXT_CONTENT);
    const langPromise = this.pdfManager.ensureCatalog("lang");
    const [contentStream,, lang] = await Promise.all([contentStreamPromise, resourcesPromise, langPromise]);
    const resources = await this.#getMergedResources(contentStream.dict, RESOURCES_KEYS_TEXT_CONTENT);
    const partialEvaluator = this.#createPartialEvaluator(handler);
    return partialEvaluator.getTextContent({
      stream: contentStream,
      task,
      resources,
      includeMarkedContent,
      disableNormalization,
      sink,
      viewBox: this.view,
      lang
    });
  }
  async getStructTree() {
    const structTreeRoot = await this.pdfManager.ensureCatalog("structTreeRoot");
    if (!structTreeRoot) {
      return null;
    }
    await this._parsedAnnotations;
    try {
      const structTree = await this.pdfManager.ensure(this, "_parseStructTree", [structTreeRoot]);
      const data = await this.pdfManager.ensure(structTree, "serializable");
      return data;
    } catch (ex) {
      warn(`getStructTree: "${ex}".`);
      return null;
    }
  }
  _parseStructTree(structTreeRoot) {
    const tree = new StructTreePage(structTreeRoot, this.pageDict);
    tree.parse(this.ref);
    return tree;
  }
  async getAnnotationsData(handler, task, intent) {
    const annotations = await this._parsedAnnotations;
    if (annotations.length === 0) {
      return annotations;
    }
    const annotationsData = [],
      textContentPromises = [];
    let partialEvaluator;
    const intentAny = !!(intent & RenderingIntentFlag.ANY),
      intentDisplay = !!(intent & RenderingIntentFlag.DISPLAY),
      intentPrint = !!(intent & RenderingIntentFlag.PRINT);
    for (const annotation of annotations) {
      const isVisible = intentAny || intentDisplay && annotation.viewable;
      if (isVisible || intentPrint && annotation.printable) {
        annotationsData.push(annotation.data);
      }
      if (annotation.hasTextContent && isVisible) {
        partialEvaluator ??= this.#createPartialEvaluator(handler);
        textContentPromises.push(annotation.extractTextContent(partialEvaluator, task, [-Infinity, -Infinity, Infinity, Infinity]).catch(function (reason) {
          warn(`getAnnotationsData - ignoring textContent during "${task.name}" task: "${reason}".`);
        }));
      }
    }
    await Promise.all(textContentPromises);
    return annotationsData;
  }
  get annotations() {
    const annots = this.#getInheritableProperty("Annots");
    return shadow(this, "annotations", Array.isArray(annots) ? annots : []);
  }
  get _parsedAnnotations() {
    const promise = this.pdfManager.ensure(this, "annotations").then(async annots => {
      if (annots.length === 0) {
        return annots;
      }
      const [annotationGlobals, fieldObjects] = await Promise.all([this.pdfManager.ensureDoc("annotationGlobals"), this.pdfManager.ensureDoc("fieldObjects")]);
      if (!annotationGlobals) {
        return [];
      }
      const orphanFields = fieldObjects?.orphanFields;
      const annotationPromises = [];
      for (const annotationRef of annots) {
        annotationPromises.push(AnnotationFactory.create(this.xref, annotationRef, annotationGlobals, this._localIdFactory, false, orphanFields, this.ref).catch(function (reason) {
          warn(`_parsedAnnotations: "${reason}".`);
          return null;
        }));
      }
      const sortedAnnotations = [];
      let popupAnnotations, widgetAnnotations;
      for (const annotation of await Promise.all(annotationPromises)) {
        if (!annotation) {
          continue;
        }
        if (annotation instanceof WidgetAnnotation) {
          (widgetAnnotations ||= []).push(annotation);
          continue;
        }
        if (annotation instanceof PopupAnnotation) {
          (popupAnnotations ||= []).push(annotation);
          continue;
        }
        sortedAnnotations.push(annotation);
      }
      if (widgetAnnotations) {
        sortedAnnotations.push(...widgetAnnotations);
      }
      if (popupAnnotations) {
        sortedAnnotations.push(...popupAnnotations);
      }
      return sortedAnnotations;
    });
    return shadow(this, "_parsedAnnotations", promise);
  }
  get jsActions() {
    const actions = collectActions(this.xref, this.pageDict, PageActionEventType);
    return shadow(this, "jsActions", actions);
  }
}
const PDF_HEADER_SIGNATURE = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
const STARTXREF_SIGNATURE = new Uint8Array([0x73, 0x74, 0x61, 0x72, 0x74, 0x78, 0x72, 0x65, 0x66]);
const ENDOBJ_SIGNATURE = new Uint8Array([0x65, 0x6e, 0x64, 0x6f, 0x62, 0x6a]);
function find(stream, signature, limit = 1024, backwards = false) {
  const signatureLength = signature.length;
  const scanBytes = stream.peekBytes(limit);
  const scanLength = scanBytes.length - signatureLength;
  if (scanLength <= 0) {
    return false;
  }
  if (backwards) {
    const signatureEnd = signatureLength - 1;
    let pos = scanBytes.length - 1;
    while (pos >= signatureEnd) {
      let j = 0;
      while (j < signatureLength && scanBytes[pos - j] === signature[signatureEnd - j]) {
        j++;
      }
      if (j >= signatureLength) {
        stream.pos += pos - signatureEnd;
        return true;
      }
      pos--;
    }
  } else {
    let pos = 0;
    while (pos <= scanLength) {
      let j = 0;
      while (j < signatureLength && scanBytes[pos + j] === signature[j]) {
        j++;
      }
      if (j >= signatureLength) {
        stream.pos += pos;
        return true;
      }
      pos++;
    }
  }
  return false;
}
class PDFDocument {
  #pagePromises = new Map();
  #version = null;
  constructor(pdfManager, stream) {
    if (stream.length <= 0) {
      throw new InvalidPDFException("The PDF file is empty, i.e. its size is zero bytes.");
    }
    this.pdfManager = pdfManager;
    this.stream = stream;
    this.xref = new XRef(stream, pdfManager);
    const idCounters = {
      font: 0
    };
    this._globalIdFactory = class {
      static getDocId() {
        return `g_${pdfManager.docId}`;
      }
      static createFontId() {
        return `f${++idCounters.font}`;
      }
      static createObjId() {
        unreachable("Abstract method `createObjId` called.");
      }
      static getPageObjId() {
        unreachable("Abstract method `getPageObjId` called.");
      }
    };
  }
  parse(recoveryMode) {
    this.xref.parse(recoveryMode);
    this.catalog = new Catalog(this.pdfManager, this.xref);
  }
  get linearization() {
    let linearization = null;
    try {
      linearization = Linearization.create(this.stream);
    } catch (err) {
      if (err instanceof MissingDataException) {
        throw err;
      }
      info(err);
    }
    return shadow(this, "linearization", linearization);
  }
  get startXRef() {
    const stream = this.stream;
    let startXRef = 0;
    if (this.linearization) {
      stream.reset();
      if (find(stream, ENDOBJ_SIGNATURE)) {
        stream.skip(6);
        let ch = stream.peekByte();
        while (isWhiteSpace(ch)) {
          stream.pos++;
          ch = stream.peekByte();
        }
        startXRef = stream.pos - stream.start;
      }
    } else {
      const step = 1024;
      const startXRefLength = STARTXREF_SIGNATURE.length;
      let found = false,
        pos = stream.end;
      while (!found && pos > 0) {
        pos -= step - startXRefLength;
        if (pos < 0) {
          pos = 0;
        }
        stream.pos = pos;
        found = find(stream, STARTXREF_SIGNATURE, step, true);
      }
      if (found) {
        stream.skip(9);
        let ch;
        do {
          ch = stream.getByte();
        } while (isWhiteSpace(ch));
        let str = "";
        while (ch >= 0x20 && ch <= 0x39) {
          str += String.fromCharCode(ch);
          ch = stream.getByte();
        }
        startXRef = parseInt(str, 10);
        if (isNaN(startXRef)) {
          startXRef = 0;
        }
      }
    }
    return shadow(this, "startXRef", startXRef);
  }
  checkHeader() {
    const stream = this.stream;
    stream.reset();
    if (!find(stream, PDF_HEADER_SIGNATURE)) {
      return;
    }
    stream.moveStart();
    stream.skip(PDF_HEADER_SIGNATURE.length);
    let version = "",
      ch;
    while ((ch = stream.getByte()) > 0x20 && version.length < 7) {
      version += String.fromCharCode(ch);
    }
    if (PDF_VERSION_REGEXP.test(version)) {
      this.#version = version;
    } else {
      warn(`Invalid PDF header version: ${version}`);
    }
  }
  parseStartXRef() {
    this.xref.setStartXRef(this.startXRef);
  }
  get numPages() {
    let num = 0;
    if (this.catalog.hasActualNumPages) {
      num = this.catalog.numPages;
    } else if (this.xfaFactory) {
      num = this.xfaFactory.getNumPages();
    } else if (this.linearization) {
      num = this.linearization.numPages;
    } else {
      num = this.catalog.numPages;
    }
    return shadow(this, "numPages", num);
  }
  #hasOnlyDocumentSignatures(fields, recursionDepth = 0) {
    const RECURSION_LIMIT = 10;
    if (!Array.isArray(fields)) {
      return false;
    }
    return fields.every(field => {
      field = this.xref.fetchIfRef(field);
      if (!(field instanceof Dict)) {
        return false;
      }
      if (field.has("Kids")) {
        if (++recursionDepth > RECURSION_LIMIT) {
          warn("#hasOnlyDocumentSignatures: maximum recursion depth reached");
          return false;
        }
        return this.#hasOnlyDocumentSignatures(field.get("Kids"), recursionDepth);
      }
      const isSignature = isName(field.get("FT"), "Sig");
      const rectangle = field.get("Rect");
      const isInvisible = Array.isArray(rectangle) && rectangle.every(value => value === 0);
      return isSignature && isInvisible;
    });
  }
  get _xfaStreams() {
    const {
      acroForm
    } = this.catalog;
    if (!acroForm) {
      return null;
    }
    const xfa = acroForm.get("XFA");
    const entries = new Map(["xdp:xdp", "template", "datasets", "config", "connectionSet", "localeSet", "stylesheet", "/xdp:xdp"].map(e => [e, null]));
    if (xfa instanceof BaseStream && !xfa.isEmpty) {
      entries.set("xdp:xdp", xfa);
      return entries;
    }
    if (!Array.isArray(xfa) || xfa.length === 0) {
      return null;
    }
    for (let i = 0, ii = xfa.length; i < ii; i += 2) {
      let name;
      if (i === 0) {
        name = "xdp:xdp";
      } else if (i === ii - 2) {
        name = "/xdp:xdp";
      } else {
        name = xfa[i];
      }
      if (!entries.has(name)) {
        continue;
      }
      const data = this.xref.fetchIfRef(xfa[i + 1]);
      if (!(data instanceof BaseStream) || data.isEmpty) {
        continue;
      }
      entries.set(name, data);
    }
    return entries;
  }
  get xfaDatasets() {
    const streams = this._xfaStreams;
    if (!streams) {
      return shadow(this, "xfaDatasets", null);
    }
    for (const key of ["datasets", "xdp:xdp"]) {
      const stream = streams.get(key);
      if (!stream) {
        continue;
      }
      try {
        const str = stringToUTF8String(stream.getString());
        const data = {
          [key]: str
        };
        return shadow(this, "xfaDatasets", new DatasetReader(data));
      } catch {
        warn("XFA - Invalid utf-8 string.");
        break;
      }
    }
    return shadow(this, "xfaDatasets", null);
  }
  get xfaData() {
    const streams = this._xfaStreams;
    if (!streams) {
      return null;
    }
    const data = Object.create(null);
    for (const [key, stream] of streams) {
      if (!stream) {
        continue;
      }
      try {
        data[key] = stringToUTF8String(stream.getString());
      } catch {
        warn("XFA - Invalid utf-8 string.");
        return null;
      }
    }
    return data;
  }
  get xfaFactory() {
    let data;
    if (this.pdfManager.enableXfa && this.catalog.needsRendering && this.formInfo.hasXfa && !this.formInfo.hasAcroForm) {
      data = this.xfaData;
    }
    return shadow(this, "xfaFactory", data ? new XFAFactory(data) : null);
  }
  get isPureXfa() {
    return this.xfaFactory ? this.xfaFactory.isValid() : false;
  }
  get htmlForXfa() {
    return this.xfaFactory ? this.xfaFactory.getPages() : null;
  }
  async #loadXfaImages() {
    const xfaImages = await this.pdfManager.ensureCatalog("xfaImages");
    if (!xfaImages) {
      return;
    }
    this.xfaFactory.setImages(xfaImages);
  }
  async #loadXfaFonts(handler, task) {
    const acroForm = await this.pdfManager.ensureCatalog("acroForm");
    if (!acroForm) {
      return;
    }
    const resources = await acroForm.getAsync("DR");
    if (!(resources instanceof Dict)) {
      return;
    }
    await ObjectLoader.load(resources, ["Font"], this.xref);
    const fontRes = resources.get("Font");
    if (!(fontRes instanceof Dict)) {
      return;
    }
    const options = Object.assign(Object.create(null), this.pdfManager.evaluatorOptions, {
      useSystemFonts: false
    });
    const {
      builtInCMapCache,
      fontCache,
      standardFontDataCache
    } = this.catalog;
    const partialEvaluator = new PartialEvaluator({
      xref: this.xref,
      handler,
      pageIndex: -1,
      idFactory: this._globalIdFactory,
      fontCache,
      builtInCMapCache,
      standardFontDataCache,
      options
    });
    const operatorList = new OperatorList();
    const pdfFonts = [];
    const initialState = {
      get font() {
        return pdfFonts.at(-1);
      },
      set font(font) {
        pdfFonts.push(font);
      },
      clone() {
        return this;
      }
    };
    const parseFont = (fontName, fallbackFontDict, cssFontInfo) => partialEvaluator.handleSetFont(resources, [Name.get(fontName), 1], null, operatorList, task, initialState, fallbackFontDict, cssFontInfo).catch(reason => {
      warn(`loadXfaFonts: "${reason}".`);
      return null;
    });
    const promises = [];
    for (const [fontName, font] of fontRes) {
      const descriptor = font.get("FontDescriptor");
      if (!(descriptor instanceof Dict)) {
        continue;
      }
      let fontFamily = descriptor.get("FontFamily");
      fontFamily = fontFamily.replaceAll(/[ ]+(\d)/g, "$1");
      const fontWeight = descriptor.get("FontWeight");
      const italicAngle = -descriptor.get("ItalicAngle");
      const cssFontInfo = {
        fontFamily,
        fontWeight,
        italicAngle
      };
      if (!validateCSSFont(cssFontInfo)) {
        continue;
      }
      promises.push(parseFont(fontName, null, cssFontInfo));
    }
    await Promise.all(promises);
    const missingFonts = this.xfaFactory.setFonts(pdfFonts);
    if (!missingFonts) {
      return;
    }
    options.ignoreErrors = true;
    promises.length = 0;
    pdfFonts.length = 0;
    const reallyMissingFonts = new Set();
    for (const missing of missingFonts) {
      if (!getXfaFontName(`${missing}-Regular`)) {
        reallyMissingFonts.add(missing);
      }
    }
    if (reallyMissingFonts.size) {
      missingFonts.push("PdfJS-Fallback");
    }
    for (const missing of missingFonts) {
      if (reallyMissingFonts.has(missing)) {
        continue;
      }
      for (const fontInfo of [{
        name: "Regular",
        fontWeight: 400,
        italicAngle: 0
      }, {
        name: "Bold",
        fontWeight: 700,
        italicAngle: 0
      }, {
        name: "Italic",
        fontWeight: 400,
        italicAngle: 12
      }, {
        name: "BoldItalic",
        fontWeight: 700,
        italicAngle: 12
      }]) {
        const name = `${missing}-${fontInfo.name}`;
        promises.push(parseFont(name, getXfaFontDict(name), {
          fontFamily: missing,
          fontWeight: fontInfo.fontWeight,
          italicAngle: fontInfo.italicAngle
        }));
      }
    }
    await Promise.all(promises);
    this.xfaFactory.appendFonts(pdfFonts, reallyMissingFonts);
  }
  loadXfaResources(handler, task) {
    return Promise.all([this.#loadXfaFonts(handler, task).catch(() => {}), this.#loadXfaImages()]);
  }
  serializeXfaData(annotationStorage) {
    return this.xfaFactory ? this.xfaFactory.serializeData(annotationStorage) : null;
  }
  get version() {
    return this.catalog.version || this.#version;
  }
  get formInfo() {
    const formInfo = {
      hasFields: false,
      hasAcroForm: false,
      hasXfa: false,
      hasSignatures: false
    };
    const {
      acroForm
    } = this.catalog;
    if (!acroForm) {
      return shadow(this, "formInfo", formInfo);
    }
    try {
      const fields = acroForm.get("Fields");
      const hasFields = Array.isArray(fields) && fields.length > 0;
      formInfo.hasFields = hasFields;
      const xfa = acroForm.get("XFA");
      formInfo.hasXfa = Array.isArray(xfa) && xfa.length > 0 || xfa instanceof BaseStream && !xfa.isEmpty;
      const sigFlags = acroForm.get("SigFlags");
      const hasSignatures = !!(sigFlags & 0x1);
      const hasOnlyDocumentSignatures = hasSignatures && this.#hasOnlyDocumentSignatures(fields);
      formInfo.hasAcroForm = hasFields && !hasOnlyDocumentSignatures;
      formInfo.hasSignatures = hasSignatures;
    } catch (ex) {
      if (ex instanceof MissingDataException) {
        throw ex;
      }
      warn(`Cannot fetch form information: "${ex}".`);
    }
    return shadow(this, "formInfo", formInfo);
  }
  get documentInfo() {
    const {
      catalog,
      formInfo,
      xref
    } = this;
    const docInfo = {
      PDFFormatVersion: this.version,
      Language: catalog.lang,
      EncryptFilterName: xref.encrypt?.filterName ?? null,
      IsLinearized: !!this.linearization,
      IsAcroFormPresent: formInfo.hasAcroForm,
      IsXFAPresent: formInfo.hasXfa,
      IsCollectionPresent: !!catalog.collection,
      IsSignaturesPresent: formInfo.hasSignatures
    };
    let infoDict;
    try {
      infoDict = xref.trailer.get("Info");
    } catch (err) {
      if (err instanceof MissingDataException) {
        throw err;
      }
      info("The document information dictionary is invalid.");
    }
    if (!(infoDict instanceof Dict)) {
      return shadow(this, "documentInfo", docInfo);
    }
    for (const [key, value] of infoDict) {
      switch (key) {
        case "Title":
        case "Author":
        case "Subject":
        case "Keywords":
        case "Creator":
        case "Producer":
        case "CreationDate":
        case "ModDate":
          if (typeof value === "string") {
            docInfo[key] = stringToPDFString(value);
            continue;
          }
          break;
        case "Trapped":
          if (value instanceof Name) {
            docInfo[key] = value;
            continue;
          }
          break;
        default:
          let customValue;
          switch (typeof value) {
            case "string":
              customValue = stringToPDFString(value);
              break;
            case "number":
            case "boolean":
              customValue = value;
              break;
            default:
              if (value instanceof Name) {
                customValue = value;
              }
              break;
          }
          if (customValue === undefined) {
            warn(`Bad value, for custom key "${key}", in Info: ${value}.`);
            continue;
          }
          docInfo.Custom ??= Object.create(null);
          docInfo.Custom[key] = customValue;
          continue;
      }
      warn(`Bad value, for key "${key}", in Info: ${value}.`);
    }
    return shadow(this, "documentInfo", docInfo);
  }
  get fingerprints() {
    const FINGERPRINT_FIRST_BYTES = 1024;
    const EMPTY_FINGERPRINT = "\x00".repeat(16);
    function validate(data) {
      return typeof data === "string" && data.length === 16 && data !== EMPTY_FINGERPRINT;
    }
    const id = this.xref.trailer.get("ID");
    let hashOriginal, hashModified;
    if (Array.isArray(id) && validate(id[0])) {
      hashOriginal = stringToBytes(id[0]);
      if (id[1] !== id[0] && validate(id[1])) {
        hashModified = stringToBytes(id[1]);
      }
    } else {
      hashOriginal = calculateMD5(this.stream.getByteRange(0, FINGERPRINT_FIRST_BYTES), 0, FINGERPRINT_FIRST_BYTES);
    }
    return shadow(this, "fingerprints", [toHexUtil(hashOriginal), hashModified ? toHexUtil(hashModified) : null]);
  }
  async #getLinearizationPage(pageIndex) {
    const {
      catalog,
      linearization,
      xref
    } = this;
    const ref = Ref.get(linearization.objectNumberFirst, 0);
    try {
      const obj = await xref.fetchAsync(ref);
      if (obj instanceof Dict) {
        let type = obj.getRaw("Type");
        if (type instanceof Ref) {
          type = await xref.fetchAsync(type);
        }
        if (isName(type, "Page") || !obj.has("Type") && !obj.has("Kids") && obj.has("Contents")) {
          if (!catalog.pageKidsCountCache.has(ref)) {
            catalog.pageKidsCountCache.put(ref, 1);
          }
          if (!catalog.pageIndexCache.has(ref)) {
            catalog.pageIndexCache.put(ref, 0);
          }
          return [obj, ref];
        }
      }
      throw new FormatError("The Linearization dictionary doesn't point to a valid Page dictionary.");
    } catch (reason) {
      warn(`_getLinearizationPage: "${reason.message}".`);
      return catalog.getPageDict(pageIndex);
    }
  }
  getPage(pageIndex) {
    const cachedPromise = this.#pagePromises.get(pageIndex);
    if (cachedPromise) {
      return cachedPromise;
    }
    const {
      catalog,
      linearization,
      xfaFactory
    } = this;
    let promise;
    if (xfaFactory) {
      promise = Promise.resolve([Dict.empty, null]);
    } else if (linearization?.pageFirst === pageIndex) {
      promise = this.#getLinearizationPage(pageIndex);
    } else {
      promise = catalog.getPageDict(pageIndex);
    }
    promise = promise.then(([pageDict, ref]) => new Page({
      pdfManager: this.pdfManager,
      xref: this.xref,
      pageIndex,
      pageDict,
      ref,
      globalIdFactory: this._globalIdFactory,
      fontCache: catalog.fontCache,
      builtInCMapCache: catalog.builtInCMapCache,
      standardFontDataCache: catalog.standardFontDataCache,
      globalColorSpaceCache: catalog.globalColorSpaceCache,
      globalImageCache: catalog.globalImageCache,
      systemFontCache: catalog.systemFontCache,
      nonBlendModesSet: catalog.nonBlendModesSet,
      xfaFactory
    }));
    this.#pagePromises.set(pageIndex, promise);
    return promise;
  }
  async checkFirstPage(recoveryMode = false) {
    if (recoveryMode) {
      return;
    }
    try {
      await this.getPage(0);
    } catch (reason) {
      if (reason instanceof XRefEntryException) {
        this.#pagePromises.delete(0);
        await this.cleanup();
        throw new XRefParseException();
      }
    }
  }
  async checkLastPage(recoveryMode = false) {
    const {
      catalog,
      pdfManager
    } = this;
    catalog.setActualNumPages();
    let numPages;
    try {
      await Promise.all([pdfManager.ensureDoc("xfaFactory"), pdfManager.ensureDoc("linearization"), pdfManager.ensureCatalog("numPages")]);
      if (this.xfaFactory) {
        return;
      } else if (this.linearization) {
        numPages = this.linearization.numPages;
      } else {
        numPages = catalog.numPages;
      }
      if (!Number.isInteger(numPages)) {
        throw new FormatError("Page count is not an integer.");
      } else if (numPages <= 1) {
        return;
      }
      await this.getPage(numPages - 1);
    } catch (reason) {
      this.#pagePromises.delete(numPages - 1);
      await this.cleanup();
      if (reason instanceof XRefEntryException && !recoveryMode) {
        throw new XRefParseException();
      }
      warn(`checkLastPage - invalid /Pages tree /Count: ${numPages}.`);
      let pagesTree;
      try {
        pagesTree = await catalog.getAllPageDicts(recoveryMode);
      } catch (reasonAll) {
        if (reasonAll instanceof XRefEntryException && !recoveryMode) {
          throw new XRefParseException();
        }
        catalog.setActualNumPages(1);
        return;
      }
      for (const [pageIndex, [pageDict, ref]] of pagesTree) {
        let promise;
        if (pageDict instanceof Error) {
          promise = Promise.reject(pageDict);
          promise.catch(() => {});
        } else {
          promise = Promise.resolve(new Page({
            pdfManager,
            xref: this.xref,
            pageIndex,
            pageDict,
            ref,
            globalIdFactory: this._globalIdFactory,
            fontCache: catalog.fontCache,
            builtInCMapCache: catalog.builtInCMapCache,
            standardFontDataCache: catalog.standardFontDataCache,
            globalColorSpaceCache: this.globalColorSpaceCache,
            globalImageCache: catalog.globalImageCache,
            systemFontCache: catalog.systemFontCache,
            nonBlendModesSet: catalog.nonBlendModesSet,
            xfaFactory: null
          }));
        }
        this.#pagePromises.set(pageIndex, promise);
      }
      catalog.setActualNumPages(pagesTree.size);
    }
  }
  async fontFallback(id, handler) {
    const {
      catalog,
      pdfManager
    } = this;
    for (const translatedFont of await Promise.all(catalog.fontCache)) {
      if (translatedFont.loadedName === id) {
        translatedFont.fallback(handler, pdfManager.evaluatorOptions);
        return;
      }
    }
  }
  async cleanup(manuallyTriggered = false) {
    return this.catalog ? this.catalog.cleanup(manuallyTriggered) : clearGlobalCaches();
  }
  async #collectFieldObjects(name, parentRef, fieldRef, promises, annotationGlobals, visitedRefs, orphanFields) {
    const {
      xref
    } = this;
    if (!(fieldRef instanceof Ref) || visitedRefs.has(fieldRef)) {
      return;
    }
    visitedRefs.put(fieldRef);
    const field = await xref.fetchAsync(fieldRef);
    if (!(field instanceof Dict)) {
      return;
    }
    let subtype = await field.getAsync("Subtype");
    subtype = subtype instanceof Name ? subtype.name : null;
    switch (subtype) {
      case "Link":
        return;
    }
    if (field.has("T")) {
      const partName = stringToPDFString(await field.getAsync("T"));
      name = name === "" ? partName : `${name}.${partName}`;
    } else {
      let obj = field;
      while (true) {
        obj = obj.getRaw("Parent") || parentRef;
        if (obj instanceof Ref) {
          if (visitedRefs.has(obj)) {
            break;
          }
          obj = await xref.fetchAsync(obj);
        }
        if (!(obj instanceof Dict)) {
          break;
        }
        if (obj.has("T")) {
          const partName = stringToPDFString(await obj.getAsync("T"));
          name = name === "" ? partName : `${name}.${partName}`;
          break;
        }
      }
    }
    if (parentRef && !field.has("Parent") && isName(field.get("Subtype"), "Widget")) {
      orphanFields.put(fieldRef, parentRef);
    }
    if (!promises.has(name)) {
      promises.set(name, []);
    }
    promises.get(name).push(AnnotationFactory.create(xref, fieldRef, annotationGlobals, null, true, orphanFields, null).then(annotation => annotation?.getFieldObject()).catch(function (reason) {
      warn(`#collectFieldObjects: "${reason}".`);
      return null;
    }));
    if (!field.has("Kids")) {
      return;
    }
    const kids = await field.getAsync("Kids");
    if (Array.isArray(kids)) {
      for (const kid of kids) {
        await this.#collectFieldObjects(name, fieldRef, kid, promises, annotationGlobals, visitedRefs, orphanFields);
      }
    }
  }
  get fieldObjects() {
    const promise = this.pdfManager.ensureDoc("formInfo").then(async formInfo => {
      if (!formInfo.hasFields) {
        return null;
      }
      const annotationGlobals = await this.annotationGlobals;
      if (!annotationGlobals) {
        return null;
      }
      const {
        acroForm
      } = annotationGlobals;
      const visitedRefs = new RefSet();
      const allFields = Object.create(null);
      const fieldPromises = new Map();
      const orphanFields = new RefSetCache();
      for (const fieldRef of acroForm.get("Fields")) {
        await this.#collectFieldObjects("", null, fieldRef, fieldPromises, annotationGlobals, visitedRefs, orphanFields);
      }
      const allPromises = [];
      for (const [name, promises] of fieldPromises) {
        allPromises.push(Promise.all(promises).then(fields => {
          fields = fields.filter(field => !!field);
          if (fields.length > 0) {
            allFields[name] = fields;
          }
        }));
      }
      await Promise.all(allPromises);
      return {
        allFields: objectSize(allFields) > 0 ? allFields : null,
        orphanFields
      };
    });
    return shadow(this, "fieldObjects", promise);
  }
  get hasJSActions() {
    const promise = this.pdfManager.ensureDoc("_parseHasJSActions");
    return shadow(this, "hasJSActions", promise);
  }
  async _parseHasJSActions() {
    const [catalogJsActions, fieldObjects] = await Promise.all([this.pdfManager.ensureCatalog("jsActions"), this.pdfManager.ensureDoc("fieldObjects")]);
    if (catalogJsActions) {
      return true;
    }
    if (fieldObjects?.allFields) {
      return Object.values(fieldObjects.allFields).some(fieldObject => fieldObject.some(object => object.actions !== null));
    }
    return false;
  }
  get calculationOrderIds() {
    const calculationOrder = this.catalog.acroForm?.get("CO");
    if (!Array.isArray(calculationOrder) || calculationOrder.length === 0) {
      return shadow(this, "calculationOrderIds", null);
    }
    const ids = [];
    for (const id of calculationOrder) {
      if (id instanceof Ref) {
        ids.push(id.toString());
      }
    }
    return shadow(this, "calculationOrderIds", ids.length ? ids : null);
  }
  get annotationGlobals() {
    return shadow(this, "annotationGlobals", AnnotationFactory.createGlobals(this.pdfManager));
  }
}

;// ./src/core/pdf_manager.js










function parseDocBaseUrl(url) {
  if (url) {
    const absoluteUrl = createValidAbsoluteUrl(url);
    if (absoluteUrl) {
      return absoluteUrl.href;
    }
    warn(`Invalid absolute docBaseUrl: "${url}".`);
  }
  return null;
}
class BasePdfManager {
  constructor({
    docBaseUrl,
    docId,
    enableXfa,
    evaluatorOptions,
    handler,
    password
  }) {
    this._docBaseUrl = parseDocBaseUrl(docBaseUrl);
    this._docId = docId;
    this._password = password;
    this.enableXfa = enableXfa;
    evaluatorOptions.isOffscreenCanvasSupported &&= FeatureTest.isOffscreenCanvasSupported;
    evaluatorOptions.isImageDecoderSupported &&= FeatureTest.isImageDecoderSupported;
    this.evaluatorOptions = Object.freeze(evaluatorOptions);
    ImageResizer.setOptions(evaluatorOptions);
    JpegStream.setOptions(evaluatorOptions);
    OperatorList.setOptions(evaluatorOptions);
    const options = {
      ...evaluatorOptions,
      handler
    };
    JpxImage.setOptions(options);
    IccColorSpace.setOptions(options);
    CmykICCBasedCS.setOptions(options);
  }
  get docId() {
    return this._docId;
  }
  get password() {
    return this._password;
  }
  get docBaseUrl() {
    return this._docBaseUrl;
  }
  ensureDoc(prop, args) {
    return this.ensure(this.pdfDocument, prop, args);
  }
  ensureXRef(prop, args) {
    return this.ensure(this.pdfDocument.xref, prop, args);
  }
  ensureCatalog(prop, args) {
    return this.ensure(this.pdfDocument.catalog, prop, args);
  }
  getPage(pageIndex) {
    return this.pdfDocument.getPage(pageIndex);
  }
  fontFallback(id, handler) {
    return this.pdfDocument.fontFallback(id, handler);
  }
  cleanup(manuallyTriggered = false) {
    return this.pdfDocument.cleanup(manuallyTriggered);
  }
  async ensure(obj, prop, args) {
    unreachable("Abstract method `ensure` called");
  }
  requestRange(begin, end) {
    unreachable("Abstract method `requestRange` called");
  }
  requestLoadedStream(noFetch = false) {
    unreachable("Abstract method `requestLoadedStream` called");
  }
  sendProgressiveData(chunk) {
    unreachable("Abstract method `sendProgressiveData` called");
  }
  updatePassword(password) {
    this._password = password;
  }
  terminate(reason) {
    unreachable("Abstract method `terminate` called");
  }
}
class LocalPdfManager extends BasePdfManager {
  constructor(args) {
    super(args);
    const stream = new Stream(args.source);
    this.pdfDocument = new PDFDocument(this, stream);
    this._loadedStreamPromise = Promise.resolve(stream);
  }
  async ensure(obj, prop, args) {
    const value = obj[prop];
    if (typeof value === "function") {
      return value.apply(obj, args);
    }
    return value;
  }
  requestRange(begin, end) {
    return Promise.resolve();
  }
  requestLoadedStream(noFetch = false) {
    return this._loadedStreamPromise;
  }
  terminate(reason) {}
}
class NetworkPdfManager extends BasePdfManager {
  constructor(args) {
    super(args);
    this.streamManager = new ChunkedStreamManager(args.source, {
      msgHandler: args.handler,
      length: args.length,
      disableAutoFetch: args.disableAutoFetch,
      rangeChunkSize: args.rangeChunkSize
    });
    this.pdfDocument = new PDFDocument(this, this.streamManager.getStream());
  }
  async ensure(obj, prop, args) {
    try {
      const value = obj[prop];
      if (typeof value === "function") {
        return value.apply(obj, args);
      }
      return value;
    } catch (ex) {
      if (!(ex instanceof MissingDataException)) {
        throw ex;
      }
      await this.requestRange(ex.begin, ex.end);
      return this.ensure(obj, prop, args);
    }
  }
  requestRange(begin, end) {
    return this.streamManager.requestRange(begin, end);
  }
  requestLoadedStream(noFetch = false) {
    return this.streamManager.requestAllChunks(noFetch);
  }
  sendProgressiveData(chunk) {
    this.streamManager.onReceiveData({
      chunk
    });
  }
  terminate(reason) {
    this.streamManager.abort(reason);
  }
}

;// ./src/shared/message_handler.js



const CallbackKind = {
  DATA: 1,
  ERROR: 2
};
const StreamKind = {
  CANCEL: 1,
  CANCEL_COMPLETE: 2,
  CLOSE: 3,
  ENQUEUE: 4,
  ERROR: 5,
  PULL: 6,
  PULL_COMPLETE: 7,
  START_COMPLETE: 8
};
function onFn() {}
function wrapReason(ex) {
  if (ex instanceof AbortException || ex instanceof InvalidPDFException || ex instanceof PasswordException || ex instanceof ResponseException || ex instanceof UnknownErrorException) {
    return ex;
  }
  if (!(ex instanceof Error || typeof ex === "object" && ex !== null)) {
    unreachable('wrapReason: Expected "reason" to be a (possibly cloned) Error.');
  }
  switch (ex.name) {
    case "AbortException":
      return new AbortException(ex.message);
    case "InvalidPDFException":
      return new InvalidPDFException(ex.message);
    case "PasswordException":
      return new PasswordException(ex.message, ex.code);
    case "ResponseException":
      return new ResponseException(ex.message, ex.status, ex.missing);
    case "UnknownErrorException":
      return new UnknownErrorException(ex.message, ex.details);
  }
  return new UnknownErrorException(ex.message, ex.toString());
}
class MessageHandler {
  #messageAC = new AbortController();
  constructor(sourceName, targetName, comObj) {
    this.sourceName = sourceName;
    this.targetName = targetName;
    this.comObj = comObj;
    this.callbackId = 1;
    this.streamId = 1;
    this.streamSinks = Object.create(null);
    this.streamControllers = Object.create(null);
    this.callbackCapabilities = Object.create(null);
    this.actionHandler = Object.create(null);
    comObj.addEventListener("message", this.#onMessage.bind(this), {
      signal: this.#messageAC.signal
    });
  }
  #onMessage({
    data
  }) {
    if (data.targetName !== this.sourceName) {
      return;
    }
    if (data.stream) {
      this.#processStreamMessage(data);
      return;
    }
    if (data.callback) {
      const callbackId = data.callbackId;
      const capability = this.callbackCapabilities[callbackId];
      if (!capability) {
        throw new Error(`Cannot resolve callback ${callbackId}`);
      }
      delete this.callbackCapabilities[callbackId];
      if (data.callback === CallbackKind.DATA) {
        capability.resolve(data.data);
      } else if (data.callback === CallbackKind.ERROR) {
        capability.reject(wrapReason(data.reason));
      } else {
        throw new Error("Unexpected callback case");
      }
      return;
    }
    const action = this.actionHandler[data.action];
    if (!action) {
      throw new Error(`Unknown action from worker: ${data.action}`);
    }
    if (data.callbackId) {
      const sourceName = this.sourceName,
        targetName = data.sourceName,
        comObj = this.comObj;
      Promise.try(action, data.data).then(function (result) {
        comObj.postMessage({
          sourceName,
          targetName,
          callback: CallbackKind.DATA,
          callbackId: data.callbackId,
          data: result
        });
      }, function (reason) {
        comObj.postMessage({
          sourceName,
          targetName,
          callback: CallbackKind.ERROR,
          callbackId: data.callbackId,
          reason: wrapReason(reason)
        });
      });
      return;
    }
    if (data.streamId) {
      this.#createStreamSink(data);
      return;
    }
    action(data.data);
  }
  on(actionName, handler) {
    const ah = this.actionHandler;
    if (ah[actionName]) {
      throw new Error(`There is already an actionName called "${actionName}"`);
    }
    ah[actionName] = handler;
  }
  send(actionName, data, transfers) {
    this.comObj.postMessage({
      sourceName: this.sourceName,
      targetName: this.targetName,
      action: actionName,
      data
    }, transfers);
  }
  sendWithPromise(actionName, data, transfers) {
    const callbackId = this.callbackId++;
    const capability = Promise.withResolvers();
    this.callbackCapabilities[callbackId] = capability;
    try {
      this.comObj.postMessage({
        sourceName: this.sourceName,
        targetName: this.targetName,
        action: actionName,
        callbackId,
        data
      }, transfers);
    } catch (ex) {
      capability.reject(ex);
    }
    return capability.promise;
  }
  sendWithStream(actionName, data, queueingStrategy, transfers) {
    const streamId = this.streamId++,
      sourceName = this.sourceName,
      targetName = this.targetName,
      comObj = this.comObj;
    return new ReadableStream({
      start: controller => {
        const startCapability = Promise.withResolvers();
        this.streamControllers[streamId] = {
          controller,
          startCall: startCapability,
          pullCall: null,
          cancelCall: null,
          isClosed: false
        };
        comObj.postMessage({
          sourceName,
          targetName,
          action: actionName,
          streamId,
          data,
          desiredSize: controller.desiredSize
        }, transfers);
        return startCapability.promise;
      },
      pull: controller => {
        const pullCapability = Promise.withResolvers();
        this.streamControllers[streamId].pullCall = pullCapability;
        comObj.postMessage({
          sourceName,
          targetName,
          stream: StreamKind.PULL,
          streamId,
          desiredSize: controller.desiredSize
        });
        return pullCapability.promise;
      },
      cancel: reason => {
        assert(reason instanceof Error, "cancel must have a valid reason");
        const cancelCapability = Promise.withResolvers();
        this.streamControllers[streamId].cancelCall = cancelCapability;
        this.streamControllers[streamId].isClosed = true;
        comObj.postMessage({
          sourceName,
          targetName,
          stream: StreamKind.CANCEL,
          streamId,
          reason: wrapReason(reason)
        });
        return cancelCapability.promise;
      }
    }, queueingStrategy);
  }
  #createStreamSink(data) {
    const streamId = data.streamId,
      sourceName = this.sourceName,
      targetName = data.sourceName,
      comObj = this.comObj;
    const self = this,
      action = this.actionHandler[data.action];
    const streamSink = {
      enqueue(chunk, size = 1, transfers) {
        if (this.isCancelled) {
          return;
        }
        const lastDesiredSize = this.desiredSize;
        this.desiredSize -= size;
        if (lastDesiredSize > 0 && this.desiredSize <= 0) {
          this.sinkCapability = Promise.withResolvers();
          this.ready = this.sinkCapability.promise;
        }
        comObj.postMessage({
          sourceName,
          targetName,
          stream: StreamKind.ENQUEUE,
          streamId,
          chunk
        }, transfers);
      },
      close() {
        if (this.isCancelled) {
          return;
        }
        this.isCancelled = true;
        comObj.postMessage({
          sourceName,
          targetName,
          stream: StreamKind.CLOSE,
          streamId
        });
        delete self.streamSinks[streamId];
      },
      error(reason) {
        assert(reason instanceof Error, "error must have a valid reason");
        if (this.isCancelled) {
          return;
        }
        this.isCancelled = true;
        comObj.postMessage({
          sourceName,
          targetName,
          stream: StreamKind.ERROR,
          streamId,
          reason: wrapReason(reason)
        });
      },
      sinkCapability: Promise.withResolvers(),
      onPull: null,
      onCancel: null,
      isCancelled: false,
      desiredSize: data.desiredSize,
      ready: null
    };
    streamSink.sinkCapability.resolve();
    streamSink.ready = streamSink.sinkCapability.promise;
    this.streamSinks[streamId] = streamSink;
    Promise.try(action, data.data, streamSink).then(function () {
      comObj.postMessage({
        sourceName,
        targetName,
        stream: StreamKind.START_COMPLETE,
        streamId,
        success: true
      });
    }, function (reason) {
      comObj.postMessage({
        sourceName,
        targetName,
        stream: StreamKind.START_COMPLETE,
        streamId,
        reason: wrapReason(reason)
      });
    });
  }
  #processStreamMessage(data) {
    const streamId = data.streamId,
      sourceName = this.sourceName,
      targetName = data.sourceName,
      comObj = this.comObj;
    const streamController = this.streamControllers[streamId],
      streamSink = this.streamSinks[streamId];
    switch (data.stream) {
      case StreamKind.START_COMPLETE:
        if (data.success) {
          streamController.startCall.resolve();
        } else {
          streamController.startCall.reject(wrapReason(data.reason));
        }
        break;
      case StreamKind.PULL_COMPLETE:
        if (data.success) {
          streamController.pullCall.resolve();
        } else {
          streamController.pullCall.reject(wrapReason(data.reason));
        }
        break;
      case StreamKind.PULL:
        if (!streamSink) {
          comObj.postMessage({
            sourceName,
            targetName,
            stream: StreamKind.PULL_COMPLETE,
            streamId,
            success: true
          });
          break;
        }
        if (streamSink.desiredSize <= 0 && data.desiredSize > 0) {
          streamSink.sinkCapability.resolve();
        }
        streamSink.desiredSize = data.desiredSize;
        Promise.try(streamSink.onPull || onFn).then(function () {
          comObj.postMessage({
            sourceName,
            targetName,
            stream: StreamKind.PULL_COMPLETE,
            streamId,
            success: true
          });
        }, function (reason) {
          comObj.postMessage({
            sourceName,
            targetName,
            stream: StreamKind.PULL_COMPLETE,
            streamId,
            reason: wrapReason(reason)
          });
        });
        break;
      case StreamKind.ENQUEUE:
        assert(streamController, "enqueue should have stream controller");
        if (streamController.isClosed) {
          break;
        }
        streamController.controller.enqueue(data.chunk);
        break;
      case StreamKind.CLOSE:
        assert(streamController, "close should have stream controller");
        if (streamController.isClosed) {
          break;
        }
        streamController.isClosed = true;
        streamController.controller.close();
        this.#deleteStreamController(streamController, streamId);
        break;
      case StreamKind.ERROR:
        assert(streamController, "error should have stream controller");
        streamController.controller.error(wrapReason(data.reason));
        this.#deleteStreamController(streamController, streamId);
        break;
      case StreamKind.CANCEL_COMPLETE:
        if (data.success) {
          streamController.cancelCall.resolve();
        } else {
          streamController.cancelCall.reject(wrapReason(data.reason));
        }
        this.#deleteStreamController(streamController, streamId);
        break;
      case StreamKind.CANCEL:
        if (!streamSink) {
          break;
        }
        const dataReason = wrapReason(data.reason);
        Promise.try(streamSink.onCancel || onFn, dataReason).then(function () {
          comObj.postMessage({
            sourceName,
            targetName,
            stream: StreamKind.CANCEL_COMPLETE,
            streamId,
            success: true
          });
        }, function (reason) {
          comObj.postMessage({
            sourceName,
            targetName,
            stream: StreamKind.CANCEL_COMPLETE,
            streamId,
            reason: wrapReason(reason)
          });
        });
        streamSink.sinkCapability.reject(dataReason);
        streamSink.isCancelled = true;
        delete this.streamSinks[streamId];
        break;
      default:
        throw new Error("Unexpected stream case");
    }
  }
  async #deleteStreamController(streamController, streamId) {
    await Promise.allSettled([streamController.startCall?.promise, streamController.pullCall?.promise, streamController.cancelCall?.promise]);
    delete this.streamControllers[streamId];
  }
  destroy() {
    this.#messageAC?.abort();
    this.#messageAC = null;
  }
}

;// ./src/core/writer.js

















async function writeObject(ref, obj, buffer, {
  encrypt = null
}) {
  const transform = encrypt?.createCipherTransform(ref.num, ref.gen);
  buffer.push(`${ref.num} ${ref.gen} obj\n`);
  if (obj instanceof Dict) {
    await writeDict(obj, buffer, transform);
  } else if (obj instanceof BaseStream) {
    await writeStream(obj, buffer, transform);
  } else if (Array.isArray(obj) || ArrayBuffer.isView(obj)) {
    await writeArray(obj, buffer, transform);
  }
  buffer.push("\nendobj\n");
}
async function writeDict(dict, buffer, transform) {
  buffer.push("<<");
  for (const key of dict.getKeys()) {
    buffer.push(` /${escapePDFName(key)} `);
    await writeValue(dict.getRaw(key), buffer, transform);
  }
  buffer.push(">>");
}
async function writeStream(stream, buffer, transform) {
  let bytes = stream.getBytes();
  const {
    dict
  } = stream;
  const [filter, params] = await Promise.all([dict.getAsync("Filter"), dict.getAsync("DecodeParms")]);
  const filterZero = Array.isArray(filter) ? await dict.xref.fetchIfRefAsync(filter[0]) : filter;
  const isFilterZeroFlateDecode = isName(filterZero, "FlateDecode");
  const MIN_LENGTH_FOR_COMPRESSING = 256;
  if (bytes.length >= MIN_LENGTH_FOR_COMPRESSING || isFilterZeroFlateDecode) {
    try {
      const cs = new CompressionStream("deflate");
      const writer = cs.writable.getWriter();
      await writer.ready;
      writer.write(bytes).then(async () => {
        await writer.ready;
        await writer.close();
      }).catch(() => {});
      const buf = await new Response(cs.readable).arrayBuffer();
      bytes = new Uint8Array(buf);
      let newFilter, newParams;
      if (!filter) {
        newFilter = Name.get("FlateDecode");
      } else if (!isFilterZeroFlateDecode) {
        newFilter = Array.isArray(filter) ? [Name.get("FlateDecode"), ...filter] : [Name.get("FlateDecode"), filter];
        if (params) {
          newParams = Array.isArray(params) ? [null, ...params] : [null, params];
        }
      }
      if (newFilter) {
        dict.set("Filter", newFilter);
      }
      if (newParams) {
        dict.set("DecodeParms", newParams);
      }
    } catch (ex) {
      info(`writeStream - cannot compress data: "${ex}".`);
    }
  }
  let string = bytesToString(bytes);
  if (transform) {
    string = transform.encryptString(string);
  }
  dict.set("Length", string.length);
  await writeDict(dict, buffer, transform);
  buffer.push(" stream\n", string, "\nendstream");
}
async function writeArray(array, buffer, transform) {
  buffer.push("[");
  let first = true;
  for (const val of array) {
    if (!first) {
      buffer.push(" ");
    } else {
      first = false;
    }
    await writeValue(val, buffer, transform);
  }
  buffer.push("]");
}
async function writeValue(value, buffer, transform) {
  if (value instanceof Name) {
    buffer.push(`/${escapePDFName(value.name)}`);
  } else if (value instanceof Ref) {
    buffer.push(`${value.num} ${value.gen} R`);
  } else if (Array.isArray(value) || ArrayBuffer.isView(value)) {
    await writeArray(value, buffer, transform);
  } else if (typeof value === "string") {
    if (transform) {
      value = transform.encryptString(value);
    }
    buffer.push(`(${escapeString(value)})`);
  } else if (typeof value === "number") {
    buffer.push(numberToString(value));
  } else if (typeof value === "boolean") {
    buffer.push(value.toString());
  } else if (value instanceof Dict) {
    await writeDict(value, buffer, transform);
  } else if (value instanceof BaseStream) {
    await writeStream(value, buffer, transform);
  } else if (value === null) {
    buffer.push("null");
  } else {
    warn(`Unhandled value in writer: ${typeof value}, please file a bug.`);
  }
}
function writeInt(number, size, offset, buffer) {
  for (let i = size + offset - 1; i > offset - 1; i--) {
    buffer[i] = number & 0xff;
    number >>= 8;
  }
  return offset + size;
}
function writeString(string, offset, buffer) {
  const ii = string.length;
  for (let i = 0; i < ii; i++) {
    buffer[offset + i] = string.charCodeAt(i) & 0xff;
  }
  return offset + ii;
}
function computeMD5(filesize, xrefInfo) {
  const time = Math.floor(Date.now() / 1000);
  const filename = xrefInfo.filename || "";
  const md5Buffer = [time.toString(), filename, filesize.toString(), ...xrefInfo.infoMap.values()];
  const md5BufferLen = Math.sumPrecise(md5Buffer.map(str => str.length));
  const array = new Uint8Array(md5BufferLen);
  let offset = 0;
  for (const str of md5Buffer) {
    offset = writeString(str, offset, array);
  }
  return bytesToString(calculateMD5(array, 0, array.length));
}
function writeXFADataForAcroform(str, changes) {
  const xml = new SimpleXMLParser({
    hasAttributes: true
  }).parseFromString(str);
  for (const {
    xfa
  } of changes) {
    if (!xfa) {
      continue;
    }
    const {
      path,
      value
    } = xfa;
    if (!path) {
      continue;
    }
    const nodePath = parseXFAPath(path);
    let node = xml.documentElement.searchNode(nodePath, 0);
    if (!node && nodePath.length > 1) {
      node = xml.documentElement.searchNode([nodePath.at(-1)], 0);
    }
    if (node) {
      node.childNodes = Array.isArray(value) ? value.map(val => new SimpleDOMNode("value", val)) : [new SimpleDOMNode("#text", value)];
    } else {
      warn(`Node not found for path: ${path}`);
    }
  }
  const buffer = [];
  xml.documentElement.dump(buffer);
  return buffer.join("");
}
async function updateAcroform({
  xref,
  acroForm,
  acroFormRef,
  hasXfa,
  hasXfaDatasetsEntry,
  xfaDatasetsRef,
  needAppearances,
  changes
}) {
  if (hasXfa && !hasXfaDatasetsEntry && !xfaDatasetsRef) {
    warn("XFA - Cannot save it");
  }
  if (!needAppearances && (!hasXfa || !xfaDatasetsRef || hasXfaDatasetsEntry)) {
    return;
  }
  const dict = acroForm.clone();
  if (hasXfa && !hasXfaDatasetsEntry) {
    const newXfa = acroForm.get("XFA").slice();
    newXfa.splice(2, 0, "datasets");
    newXfa.splice(3, 0, xfaDatasetsRef);
    dict.set("XFA", newXfa);
  }
  if (needAppearances) {
    dict.set("NeedAppearances", true);
  }
  changes.put(acroFormRef, {
    data: dict
  });
}
function updateXFA({
  xfaData,
  xfaDatasetsRef,
  changes,
  xref
}) {
  if (xfaData === null) {
    const datasets = xref.fetchIfRef(xfaDatasetsRef);
    xfaData = writeXFADataForAcroform(datasets.getString(), changes);
  }
  const xfaDataStream = new StringStream(xfaData);
  xfaDataStream.dict = new Dict(xref);
  xfaDataStream.dict.set("Type", Name.get("EmbeddedFile"));
  changes.put(xfaDatasetsRef, {
    data: xfaDataStream
  });
}
async function getXRefTable(xrefInfo, baseOffset, newRefs, newXref, buffer) {
  buffer.push("xref\n");
  const indexes = getIndexes(newRefs);
  let indexesPosition = 0;
  for (const {
    ref,
    data
  } of newRefs) {
    if (ref.num === indexes[indexesPosition]) {
      buffer.push(`${indexes[indexesPosition]} ${indexes[indexesPosition + 1]}\n`);
      indexesPosition += 2;
    }
    if (data !== null) {
      buffer.push(`${baseOffset.toString().padStart(10, "0")} ${Math.min(ref.gen, 0xffff).toString().padStart(5, "0")} n\r\n`);
      baseOffset += data.length;
    } else {
      buffer.push(`0000000000 ${Math.min(ref.gen + 1, 0xffff).toString().padStart(5, "0")} f\r\n`);
    }
  }
  computeIDs(baseOffset, xrefInfo, newXref);
  buffer.push("trailer\n");
  await writeDict(newXref, buffer);
  buffer.push("\nstartxref\n", baseOffset.toString(), "\n%%EOF\n");
}
function getIndexes(newRefs) {
  const indexes = [];
  for (const {
    ref
  } of newRefs) {
    if (ref.num === indexes.at(-2) + indexes.at(-1)) {
      indexes[indexes.length - 1] += 1;
    } else {
      indexes.push(ref.num, 1);
    }
  }
  return indexes;
}
async function getXRefStreamTable(xrefInfo, baseOffset, newRefs, newXref, buffer) {
  const xrefTableData = [];
  let maxOffset = 0;
  let maxGen = 0;
  for (const {
    ref,
    data
  } of newRefs) {
    let gen;
    maxOffset = Math.max(maxOffset, baseOffset);
    if (data !== null) {
      gen = Math.min(ref.gen, 0xffff);
      xrefTableData.push([1, baseOffset, gen]);
      baseOffset += data.length;
    } else {
      gen = Math.min(ref.gen + 1, 0xffff);
      xrefTableData.push([0, 0, gen]);
    }
    maxGen = Math.max(maxGen, gen);
  }
  newXref.set("Index", getIndexes(newRefs));
  const offsetSize = getSizeInBytes(maxOffset);
  const maxGenSize = getSizeInBytes(maxGen);
  const sizes = [1, offsetSize, maxGenSize];
  newXref.set("W", sizes);
  computeIDs(baseOffset, xrefInfo, newXref);
  const structSize = Math.sumPrecise(sizes);
  const data = new Uint8Array(structSize * xrefTableData.length);
  const stream = new Stream(data);
  stream.dict = newXref;
  let offset = 0;
  for (const [type, objOffset, gen] of xrefTableData) {
    offset = writeInt(type, sizes[0], offset, data);
    offset = writeInt(objOffset, sizes[1], offset, data);
    offset = writeInt(gen, sizes[2], offset, data);
  }
  await writeObject(xrefInfo.newRef, stream, buffer, {});
  buffer.push("startxref\n", baseOffset.toString(), "\n%%EOF\n");
}
function computeIDs(baseOffset, xrefInfo, newXref) {
  if (Array.isArray(xrefInfo.fileIds) && xrefInfo.fileIds.length > 0) {
    const md5 = computeMD5(baseOffset, xrefInfo);
    newXref.set("ID", [xrefInfo.fileIds[0], md5]);
  }
}
function getTrailerDict(xrefInfo, changes, useXrefStream) {
  const newXref = new Dict(null);
  newXref.set("Prev", xrefInfo.startXRef);
  const refForXrefTable = xrefInfo.newRef;
  if (useXrefStream) {
    changes.put(refForXrefTable, {
      data: ""
    });
    newXref.set("Size", refForXrefTable.num + 1);
    newXref.set("Type", Name.get("XRef"));
  } else {
    newXref.set("Size", refForXrefTable.num);
  }
  if (xrefInfo.rootRef !== null) {
    newXref.set("Root", xrefInfo.rootRef);
  }
  if (xrefInfo.infoRef !== null) {
    newXref.set("Info", xrefInfo.infoRef);
  }
  if (xrefInfo.encryptRef !== null) {
    newXref.set("Encrypt", xrefInfo.encryptRef);
  }
  return newXref;
}
async function writeChanges(changes, xref, buffer = []) {
  const newRefs = [];
  for (const [ref, {
    data
  }] of changes.items()) {
    if (data === null || typeof data === "string") {
      newRefs.push({
        ref,
        data
      });
      continue;
    }
    await writeObject(ref, data, buffer, xref);
    newRefs.push({
      ref,
      data: buffer.join("")
    });
    buffer.length = 0;
  }
  return newRefs.sort((a, b) => a.ref.num - b.ref.num);
}
async function incrementalUpdate({
  originalData,
  xrefInfo,
  changes,
  xref = null,
  hasXfa = false,
  xfaDatasetsRef = null,
  hasXfaDatasetsEntry = false,
  needAppearances,
  acroFormRef = null,
  acroForm = null,
  xfaData = null,
  useXrefStream = false
}) {
  await updateAcroform({
    xref,
    acroForm,
    acroFormRef,
    hasXfa,
    hasXfaDatasetsEntry,
    xfaDatasetsRef,
    needAppearances,
    changes
  });
  if (hasXfa) {
    updateXFA({
      xfaData,
      xfaDatasetsRef,
      changes,
      xref
    });
  }
  const newXref = getTrailerDict(xrefInfo, changes, useXrefStream);
  const buffer = [];
  const newRefs = await writeChanges(changes, xref, buffer);
  let baseOffset = originalData.length;
  const lastByte = originalData.at(-1);
  if (lastByte !== 0x0a && lastByte !== 0x0d) {
    buffer.push("\n");
    baseOffset += 1;
  }
  for (const {
    data
  } of newRefs) {
    if (data !== null) {
      buffer.push(data);
    }
  }
  await (useXrefStream ? getXRefStreamTable(xrefInfo, baseOffset, newRefs, newXref, buffer) : getXRefTable(xrefInfo, baseOffset, newRefs, newXref, buffer));
  const totalLength = originalData.length + Math.sumPrecise(buffer.map(str => str.length));
  const array = new Uint8Array(totalLength);
  array.set(originalData);
  let offset = originalData.length;
  for (const str of buffer) {
    offset = writeString(str, offset, array);
  }
  return array;
}

;// ./src/core/worker_stream.js


class PDFWorkerStream {
  constructor(msgHandler) {
    this._msgHandler = msgHandler;
    this._contentLength = null;
    this._fullRequestReader = null;
    this._rangeRequestReaders = [];
  }
  getFullReader() {
    assert(!this._fullRequestReader, "PDFWorkerStream.getFullReader can only be called once.");
    this._fullRequestReader = new PDFWorkerStreamReader(this._msgHandler);
    return this._fullRequestReader;
  }
  getRangeReader(begin, end) {
    const reader = new PDFWorkerStreamRangeReader(begin, end, this._msgHandler);
    this._rangeRequestReaders.push(reader);
    return reader;
  }
  cancelAllRequests(reason) {
    this._fullRequestReader?.cancel(reason);
    for (const reader of this._rangeRequestReaders.slice(0)) {
      reader.cancel(reason);
    }
  }
}
class PDFWorkerStreamReader {
  constructor(msgHandler) {
    this._msgHandler = msgHandler;
    this.onProgress = null;
    this._contentLength = null;
    this._isRangeSupported = false;
    this._isStreamingSupported = false;
    const readableStream = this._msgHandler.sendWithStream("GetReader");
    this._reader = readableStream.getReader();
    this._headersReady = this._msgHandler.sendWithPromise("ReaderHeadersReady").then(data => {
      this._isStreamingSupported = data.isStreamingSupported;
      this._isRangeSupported = data.isRangeSupported;
      this._contentLength = data.contentLength;
    });
  }
  get headersReady() {
    return this._headersReady;
  }
  get contentLength() {
    return this._contentLength;
  }
  get isStreamingSupported() {
    return this._isStreamingSupported;
  }
  get isRangeSupported() {
    return this._isRangeSupported;
  }
  async read() {
    const {
      value,
      done
    } = await this._reader.read();
    if (done) {
      return {
        value: undefined,
        done: true
      };
    }
    return {
      value: value.buffer,
      done: false
    };
  }
  cancel(reason) {
    this._reader.cancel(reason);
  }
}
class PDFWorkerStreamRangeReader {
  constructor(begin, end, msgHandler) {
    this._msgHandler = msgHandler;
    this.onProgress = null;
    const readableStream = this._msgHandler.sendWithStream("GetRangeReader", {
      begin,
      end
    });
    this._reader = readableStream.getReader();
  }
  get isStreamingSupported() {
    return false;
  }
  async read() {
    const {
      value,
      done
    } = await this._reader.read();
    if (done) {
      return {
        value: undefined,
        done: true
      };
    }
    return {
      value: value.buffer,
      done: false
    };
  }
  cancel(reason) {
    this._reader.cancel(reason);
  }
}

;// ./src/core/worker.js






























class WorkerTask {
  constructor(name) {
    this.name = name;
    this.terminated = false;
    this._capability = Promise.withResolvers();
  }
  get finished() {
    return this._capability.promise;
  }
  finish() {
    this._capability.resolve();
  }
  terminate() {
    this.terminated = true;
  }
  ensureNotTerminated() {
    if (this.terminated) {
      throw new Error("Worker task was terminated");
    }
  }
}
class WorkerMessageHandler {
  static {
    if (typeof window === "undefined" && !isNodeJS && typeof self !== "undefined" && typeof self.postMessage === "function" && "onmessage" in self) {
      this.initializeFromPort(self);
    }
  }
  static setup(handler, port) {
    let testMessageProcessed = false;
    handler.on("test", data => {
      if (testMessageProcessed) {
        return;
      }
      testMessageProcessed = true;
      handler.send("test", data instanceof Uint8Array);
    });
    handler.on("configure", data => {
      setVerbosityLevel(data.verbosity);
    });
    handler.on("GetDocRequest", data => this.createDocumentHandler(data, port));
  }
  static createDocumentHandler(docParams, port) {
    let pdfManager;
    let terminated = false;
    let cancelXHRs = null;
    const WorkerTasks = new Set();
    const verbosity = getVerbosityLevel();
    const {
      docId,
      apiVersion
    } = docParams;
    const workerVersion = "5.3.31";
    if (apiVersion !== workerVersion) {
      throw new Error(`The API version "${apiVersion}" does not match ` + `the Worker version "${workerVersion}".`);
    }
    const buildMsg = (type, prop) => `The \`${type}.prototype\` contains unexpected enumerable property ` + `"${prop}", thus breaking e.g. \`for...in\` iteration of ${type}s.`;
    for (const prop in {}) {
      throw new Error(buildMsg("Object", prop));
    }
    for (const prop in []) {
      throw new Error(buildMsg("Array", prop));
    }
    const workerHandlerName = docId + "_worker";
    let handler = new MessageHandler(workerHandlerName, docId, port);
    function ensureNotTerminated() {
      if (terminated) {
        throw new Error("Worker was terminated");
      }
    }
    function startWorkerTask(task) {
      WorkerTasks.add(task);
    }
    function finishWorkerTask(task) {
      task.finish();
      WorkerTasks.delete(task);
    }
    async function loadDocument(recoveryMode) {
      await pdfManager.ensureDoc("checkHeader");
      await pdfManager.ensureDoc("parseStartXRef");
      await pdfManager.ensureDoc("parse", [recoveryMode]);
      await pdfManager.ensureDoc("checkFirstPage", [recoveryMode]);
      await pdfManager.ensureDoc("checkLastPage", [recoveryMode]);
      const isPureXfa = await pdfManager.ensureDoc("isPureXfa");
      if (isPureXfa) {
        const task = new WorkerTask("loadXfaResources");
        startWorkerTask(task);
        await pdfManager.ensureDoc("loadXfaResources", [handler, task]);
        finishWorkerTask(task);
      }
      const [numPages, fingerprints] = await Promise.all([pdfManager.ensureDoc("numPages"), pdfManager.ensureDoc("fingerprints")]);
      const htmlForXfa = isPureXfa ? await pdfManager.ensureDoc("htmlForXfa") : null;
      return {
        numPages,
        fingerprints,
        htmlForXfa
      };
    }
    async function getPdfManager({
      data,
      password,
      disableAutoFetch,
      rangeChunkSize,
      length,
      docBaseUrl,
      enableXfa,
      evaluatorOptions
    }) {
      const pdfManagerArgs = {
        source: null,
        disableAutoFetch,
        docBaseUrl,
        docId,
        enableXfa,
        evaluatorOptions,
        handler,
        length,
        password,
        rangeChunkSize
      };
      if (data) {
        pdfManagerArgs.source = data;
        return new LocalPdfManager(pdfManagerArgs);
      }
      const pdfStream = new PDFWorkerStream(handler),
        fullRequest = pdfStream.getFullReader();
      const pdfManagerCapability = Promise.withResolvers();
      let newPdfManager,
        cachedChunks = [],
        loaded = 0;
      fullRequest.headersReady.then(function () {
        if (!fullRequest.isRangeSupported) {
          return;
        }
        pdfManagerArgs.source = pdfStream;
        pdfManagerArgs.length = fullRequest.contentLength;
        pdfManagerArgs.disableAutoFetch ||= fullRequest.isStreamingSupported;
        newPdfManager = new NetworkPdfManager(pdfManagerArgs);
        for (const chunk of cachedChunks) {
          newPdfManager.sendProgressiveData(chunk);
        }
        cachedChunks = [];
        pdfManagerCapability.resolve(newPdfManager);
        cancelXHRs = null;
      }).catch(function (reason) {
        pdfManagerCapability.reject(reason);
        cancelXHRs = null;
      });
      new Promise(function (resolve, reject) {
        const readChunk = function ({
          value,
          done
        }) {
          try {
            ensureNotTerminated();
            if (done) {
              if (!newPdfManager) {
                const pdfFile = arrayBuffersToBytes(cachedChunks);
                cachedChunks = [];
                if (length && pdfFile.length !== length) {
                  warn("reported HTTP length is different from actual");
                }
                pdfManagerArgs.source = pdfFile;
                newPdfManager = new LocalPdfManager(pdfManagerArgs);
                pdfManagerCapability.resolve(newPdfManager);
              }
              cancelXHRs = null;
              return;
            }
            loaded += value.byteLength;
            if (!fullRequest.isStreamingSupported) {
              handler.send("DocProgress", {
                loaded,
                total: Math.max(loaded, fullRequest.contentLength || 0)
              });
            }
            if (newPdfManager) {
              newPdfManager.sendProgressiveData(value);
            } else {
              cachedChunks.push(value);
            }
            fullRequest.read().then(readChunk, reject);
          } catch (e) {
            reject(e);
          }
        };
        fullRequest.read().then(readChunk, reject);
      }).catch(function (e) {
        pdfManagerCapability.reject(e);
        cancelXHRs = null;
      });
      cancelXHRs = reason => {
        pdfStream.cancelAllRequests(reason);
      };
      return pdfManagerCapability.promise;
    }
    function setupDoc(data) {
      function onSuccess(doc) {
        ensureNotTerminated();
        handler.send("GetDoc", {
          pdfInfo: doc
        });
      }
      function onFailure(ex) {
        ensureNotTerminated();
        if (ex instanceof PasswordException) {
          const task = new WorkerTask(`PasswordException: response ${ex.code}`);
          startWorkerTask(task);
          handler.sendWithPromise("PasswordRequest", ex).then(function ({
            password
          }) {
            finishWorkerTask(task);
            pdfManager.updatePassword(password);
            pdfManagerReady();
          }).catch(function () {
            finishWorkerTask(task);
            handler.send("DocException", ex);
          });
        } else {
          handler.send("DocException", wrapReason(ex));
        }
      }
      function pdfManagerReady() {
        ensureNotTerminated();
        loadDocument(false).then(onSuccess, function (reason) {
          ensureNotTerminated();
          if (!(reason instanceof XRefParseException)) {
            onFailure(reason);
            return;
          }
          pdfManager.requestLoadedStream().then(function () {
            ensureNotTerminated();
            loadDocument(true).then(onSuccess, onFailure);
          });
        });
      }
      ensureNotTerminated();
      getPdfManager(data).then(function (newPdfManager) {
        if (terminated) {
          newPdfManager.terminate(new AbortException("Worker was terminated."));
          throw new Error("Worker was terminated");
        }
        pdfManager = newPdfManager;
        pdfManager.requestLoadedStream(true).then(stream => {
          handler.send("DataLoaded", {
            length: stream.bytes.byteLength
          });
        });
      }).then(pdfManagerReady, onFailure);
    }
    handler.on("GetPage", function (data) {
      return pdfManager.getPage(data.pageIndex).then(function (page) {
        return Promise.all([pdfManager.ensure(page, "rotate"), pdfManager.ensure(page, "ref"), pdfManager.ensure(page, "userUnit"), pdfManager.ensure(page, "view")]).then(function ([rotate, ref, userUnit, view]) {
          return {
            rotate,
            ref,
            refStr: ref?.toString() ?? null,
            userUnit,
            view
          };
        });
      });
    });
    handler.on("GetPageIndex", function (data) {
      const pageRef = Ref.get(data.num, data.gen);
      return pdfManager.ensureCatalog("getPageIndex", [pageRef]);
    });
    handler.on("GetDestinations", function (data) {
      return pdfManager.ensureCatalog("destinations");
    });
    handler.on("GetDestination", function (data) {
      return pdfManager.ensureCatalog("getDestination", [data.id]);
    });
    handler.on("GetPageLabels", function (data) {
      return pdfManager.ensureCatalog("pageLabels");
    });
    handler.on("GetPageLayout", function (data) {
      return pdfManager.ensureCatalog("pageLayout");
    });
    handler.on("GetPageMode", function (data) {
      return pdfManager.ensureCatalog("pageMode");
    });
    handler.on("GetViewerPreferences", function (data) {
      return pdfManager.ensureCatalog("viewerPreferences");
    });
    handler.on("GetOpenAction", function (data) {
      return pdfManager.ensureCatalog("openAction");
    });
    handler.on("GetAttachments", function (data) {
      return pdfManager.ensureCatalog("attachments");
    });
    handler.on("GetDocJSActions", function (data) {
      return pdfManager.ensureCatalog("jsActions");
    });
    handler.on("GetPageJSActions", function ({
      pageIndex
    }) {
      return pdfManager.getPage(pageIndex).then(page => pdfManager.ensure(page, "jsActions"));
    });
    handler.on("GetOutline", function (data) {
      return pdfManager.ensureCatalog("documentOutline");
    });
    handler.on("GetOptionalContentConfig", function (data) {
      return pdfManager.ensureCatalog("optionalContentConfig");
    });
    handler.on("GetPermissions", function (data) {
      return pdfManager.ensureCatalog("permissions");
    });
    handler.on("GetMetadata", function (data) {
      return Promise.all([pdfManager.ensureDoc("documentInfo"), pdfManager.ensureCatalog("metadata")]);
    });
    handler.on("GetMarkInfo", function (data) {
      return pdfManager.ensureCatalog("markInfo");
    });
    handler.on("GetData", function (data) {
      return pdfManager.requestLoadedStream().then(stream => stream.bytes);
    });
    handler.on("GetAnnotations", function ({
      pageIndex,
      intent
    }) {
      return pdfManager.getPage(pageIndex).then(function (page) {
        const task = new WorkerTask(`GetAnnotations: page ${pageIndex}`);
        startWorkerTask(task);
        return page.getAnnotationsData(handler, task, intent).then(data => {
          finishWorkerTask(task);
          return data;
        }, reason => {
          finishWorkerTask(task);
          throw reason;
        });
      });
    });
    handler.on("GetFieldObjects", function (data) {
      return pdfManager.ensureDoc("fieldObjects").then(fieldObjects => fieldObjects?.allFields || null);
    });
    handler.on("HasJSActions", function (data) {
      return pdfManager.ensureDoc("hasJSActions");
    });
    handler.on("GetCalculationOrderIds", function (data) {
      return pdfManager.ensureDoc("calculationOrderIds");
    });
    handler.on("SaveDocument", async function ({
      isPureXfa,
      numPages,
      annotationStorage,
      filename
    }) {
      const globalPromises = [pdfManager.requestLoadedStream(), pdfManager.ensureCatalog("acroForm"), pdfManager.ensureCatalog("acroFormRef"), pdfManager.ensureDoc("startXRef"), pdfManager.ensureDoc("xref"), pdfManager.ensureDoc("linearization"), pdfManager.ensureCatalog("structTreeRoot")];
      const changes = new RefSetCache();
      const promises = [];
      const newAnnotationsByPage = !isPureXfa ? getNewAnnotationsMap(annotationStorage) : null;
      const [stream, acroForm, acroFormRef, startXRef, xref, linearization, _structTreeRoot] = await Promise.all(globalPromises);
      const catalogRef = xref.trailer.getRaw("Root") || null;
      let structTreeRoot;
      if (newAnnotationsByPage) {
        if (!_structTreeRoot) {
          if (await StructTreeRoot.canCreateStructureTree({
            catalogRef,
            pdfManager,
            newAnnotationsByPage
          })) {
            structTreeRoot = null;
          }
        } else if (await _structTreeRoot.canUpdateStructTree({
          pdfManager,
          newAnnotationsByPage
        })) {
          structTreeRoot = _structTreeRoot;
        }
        const imagePromises = AnnotationFactory.generateImages(annotationStorage.values(), xref, pdfManager.evaluatorOptions.isOffscreenCanvasSupported);
        const newAnnotationPromises = structTreeRoot === undefined ? promises : [];
        for (const [pageIndex, annotations] of newAnnotationsByPage) {
          newAnnotationPromises.push(pdfManager.getPage(pageIndex).then(page => {
            const task = new WorkerTask(`Save (editor): page ${pageIndex}`);
            startWorkerTask(task);
            return page.saveNewAnnotations(handler, task, annotations, imagePromises, changes).finally(function () {
              finishWorkerTask(task);
            });
          }));
        }
        if (structTreeRoot === null) {
          promises.push(Promise.all(newAnnotationPromises).then(async () => {
            await StructTreeRoot.createStructureTree({
              newAnnotationsByPage,
              xref,
              catalogRef,
              pdfManager,
              changes
            });
          }));
        } else if (structTreeRoot) {
          promises.push(Promise.all(newAnnotationPromises).then(async () => {
            await structTreeRoot.updateStructureTree({
              newAnnotationsByPage,
              pdfManager,
              changes
            });
          }));
        }
      }
      if (isPureXfa) {
        promises.push(pdfManager.ensureDoc("serializeXfaData", [annotationStorage]));
      } else {
        for (let pageIndex = 0; pageIndex < numPages; pageIndex++) {
          promises.push(pdfManager.getPage(pageIndex).then(function (page) {
            const task = new WorkerTask(`Save: page ${pageIndex}`);
            startWorkerTask(task);
            return page.save(handler, task, annotationStorage, changes).finally(function () {
              finishWorkerTask(task);
            });
          }));
        }
      }
      const refs = await Promise.all(promises);
      let xfaData = null;
      if (isPureXfa) {
        xfaData = refs[0];
        if (!xfaData) {
          return stream.bytes;
        }
      } else if (changes.size === 0) {
        return stream.bytes;
      }
      const needAppearances = acroFormRef && acroForm instanceof Dict && changes.values().some(ref => ref.needAppearances);
      const xfa = acroForm instanceof Dict && acroForm.get("XFA") || null;
      let xfaDatasetsRef = null;
      let hasXfaDatasetsEntry = false;
      if (Array.isArray(xfa)) {
        for (let i = 0, ii = xfa.length; i < ii; i += 2) {
          if (xfa[i] === "datasets") {
            xfaDatasetsRef = xfa[i + 1];
            hasXfaDatasetsEntry = true;
          }
        }
        if (xfaDatasetsRef === null) {
          xfaDatasetsRef = xref.getNewTemporaryRef();
        }
      } else if (xfa) {
        warn("Unsupported XFA type.");
      }
      let newXrefInfo = Object.create(null);
      if (xref.trailer) {
        const infoMap = new Map();
        const xrefInfo = xref.trailer.get("Info") || null;
        if (xrefInfo instanceof Dict) {
          for (const [key, value] of xrefInfo) {
            if (typeof value === "string") {
              infoMap.set(key, stringToPDFString(value));
            }
          }
        }
        newXrefInfo = {
          rootRef: catalogRef,
          encryptRef: xref.trailer.getRaw("Encrypt") || null,
          newRef: xref.getNewTemporaryRef(),
          infoRef: xref.trailer.getRaw("Info") || null,
          infoMap,
          fileIds: xref.trailer.get("ID") || null,
          startXRef: linearization ? startXRef : xref.lastXRefStreamPos ?? startXRef,
          filename
        };
      }
      return incrementalUpdate({
        originalData: stream.bytes,
        xrefInfo: newXrefInfo,
        changes,
        xref,
        hasXfa: !!xfa,
        xfaDatasetsRef,
        hasXfaDatasetsEntry,
        needAppearances,
        acroFormRef,
        acroForm,
        xfaData,
        useXrefStream: isDict(xref.topDict, "XRef")
      }).finally(() => {
        xref.resetNewTemporaryRef();
      });
    });
    handler.on("GetOperatorList", function (data, sink) {
      const pageIndex = data.pageIndex;
      pdfManager.getPage(pageIndex).then(function (page) {
        const task = new WorkerTask(`GetOperatorList: page ${pageIndex}`);
        startWorkerTask(task);
        const start = verbosity >= VerbosityLevel.INFOS ? Date.now() : 0;
        page.getOperatorList({
          handler,
          sink,
          task,
          intent: data.intent,
          cacheKey: data.cacheKey,
          annotationStorage: data.annotationStorage,
          modifiedIds: data.modifiedIds
        }).then(function (operatorListInfo) {
          finishWorkerTask(task);
          if (start) {
            info(`page=${pageIndex + 1} - getOperatorList: time=` + `${Date.now() - start}ms, len=${operatorListInfo.length}`);
          }
          sink.close();
        }, function (reason) {
          finishWorkerTask(task);
          if (task.terminated) {
            return;
          }
          sink.error(reason);
        });
      });
    });
    handler.on("GetTextContent", function (data, sink) {
      const {
        pageIndex,
        includeMarkedContent,
        disableNormalization
      } = data;
      pdfManager.getPage(pageIndex).then(function (page) {
        const task = new WorkerTask("GetTextContent: page " + pageIndex);
        startWorkerTask(task);
        const start = verbosity >= VerbosityLevel.INFOS ? Date.now() : 0;
        page.extractTextContent({
          handler,
          task,
          sink,
          includeMarkedContent,
          disableNormalization
        }).then(function () {
          finishWorkerTask(task);
          if (start) {
            info(`page=${pageIndex + 1} - getTextContent: time=` + `${Date.now() - start}ms`);
          }
          sink.close();
        }, function (reason) {
          finishWorkerTask(task);
          if (task.terminated) {
            return;
          }
          sink.error(reason);
        });
      });
    });
    handler.on("GetStructTree", function (data) {
      return pdfManager.getPage(data.pageIndex).then(page => pdfManager.ensure(page, "getStructTree"));
    });
    handler.on("FontFallback", function (data) {
      return pdfManager.fontFallback(data.id, handler);
    });
    handler.on("Cleanup", function (data) {
      return pdfManager.cleanup(true);
    });
    handler.on("Terminate", function (data) {
      terminated = true;
      const waitOn = [];
      if (pdfManager) {
        pdfManager.terminate(new AbortException("Worker was terminated."));
        const cleanupPromise = pdfManager.cleanup();
        waitOn.push(cleanupPromise);
        pdfManager = null;
      } else {
        clearGlobalCaches();
      }
      cancelXHRs?.(new AbortException("Worker was terminated."));
      for (const task of WorkerTasks) {
        waitOn.push(task.finished);
        task.terminate();
      }
      return Promise.all(waitOn).then(function () {
        handler.destroy();
        handler = null;
      });
    });
    handler.on("Ready", function (data) {
      setupDoc(docParams);
      docParams = null;
    });
    return workerHandlerName;
  }
  static initializeFromPort(port) {
    const handler = new MessageHandler("worker", "main", port);
    this.setup(handler, port);
    handler.send("ready", null);
  }
}

;// ./src/pdf.worker.js

globalThis.pdfjsWorker = {
  WorkerMessageHandler: WorkerMessageHandler
};

export { WorkerMessageHandler };

//# sourceMappingURL=pdf.worker.mjs.map