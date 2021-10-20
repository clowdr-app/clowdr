export const defaultTitleTemplate = "{{{itemTitle}}} ({{{fileName}}})";

export const defaultDescriptionTemplate = `{{#abstract}}{{{abstract}}}

{{/abstract}}
{{#authors.length}}
{{#authors}}{{{name}}}{{#affiliation}} ({{{affiliation}}}){{/affiliation}}, {{/authors}}

{{/authors.length}}
{{#paperLinks.length}}
{{#paperLinks}}{{#url}}
* {{{text}}}: {{{url}}}
{{/url}}{{/paperLinks}}

{{/paperLinks.length}}
{{#paperUrls.length}}
{{#paperUrls}}{{#.}}* {{{.}}}
{{/.}}{{/paperUrls}}

{{/paperUrls.length}}
`;
