English / [日本語](./README.ja.md)

# Mapping Template Compose

Makes [Amazon API Gateway](https://aws.amazon.com/api-gateway/)'s [mapping template](https://docs.aws.amazon.com/apigateway/latest/developerguide/rest-api-data-transformations.html) composable.

This library is especially powerful if you combine it with [AWS Cloud Development Kit](https://aws.amazon.com/cdk/).

## Installing this library

```sh
npm install https://github.com/codemonger-io/mapping-template-compose.git#v0.2.0
```

### Installing from GitHub Packages

Every time commits are pushed to the `main` branch, a _developer package_ is published to the npm registry managed by GitHub Packages.
A _developer package_ bears the next release version number but followed by a dash (`-`) plus the short commit hash; e.g., `0.2.0-abc1234` where `abc1234` is the short commit hash of the commit used to build the package (_snapshot_).
You can find _developer packages_ [here](https://github.com/codemonger-io/mapping-template-compose/pkgs/npm/mapping-template-compose).

#### Configuring a GitHub personal access token

To install a _developer package_, you need to configure a **classic** GitHub personal access token (PAT) with at least the `read:packages` scope.
Below briefly explains how to configure a PAT.
Please refer to the [GitHub documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) for more details.

Once you have a PAT, please create a `.npmrc` file in your home directory with the following content:

```sh
//npm.pkg.github.com/:_authToken=$YOUR_GITHUB_PAT
```

Please replace `$YOUR_GITHUB_PAT` with your PAT.

In the root directory of your project, please create a `.npmrc` file with the following content:

```sh
@codemonger-io:registry=https://npm.pkg.github.com
```

Then you can install a _developer package_ with the following command:

```sh
npm install @codemonger-io/mapping-template-compose@0.2.0-abc1234
```

Please replace `abc1234` with the short commit hash of the _snapshot_ you want to install.

## Motivation

Have you ever felt that describing mapping templates for Amazon API Gateway is cumbersome?
I got tired of writing mapping templates because:
1. I had to write a lot of boilderplate code; e.g., extracting a query parameter as a property:

    ```json
    "username": "$util.escapeJavaScript($util.urlDecode($input.params("username"))).replaceAll("\\'", "'")"
    ```

2. It was difficult to reuse components of mapping templates

Regarding the second issue, the major difficulty is in making sure a JSON representation resulting from a mapping template valid.

Suppose you have the following property definitions as components:

```ts
const username = `"username": "$util.escapeJavaScript($util.urlDecode($input.params("username"))).replaceAll("\\'", "'")"`;
const signature = `"signature": $input.json("$.signature")`;
const date = `"date": "$util.escapeJavaScript($util.urlDecode($input.params("date"))).replaceAll("\\'", "'")"`;
```

If we want to construct a simple object that has all the above properties:

```json
{
  "username": "$util.escapeJavaScript($util.urlDecode($input.params("username"))).replaceAll("\\'", "'")",
  "signature": $input.json("$.signature"),
  "date": "$util.escapeJavaScript($util.urlDecode($input.params("date"))).replaceAll("\\'", "'")"
}
```

You have to omit a trailing comma after the last property `date`, though, this is rather straightforward:

```ts
`{
  ${[username, signature, date].join(',\n  ')}
}`
```

What if all the properties may be omitted?
You might come up with the following code:

```ts
`{
#if ($input.params('username') != "")
  ${username},
#end
#if ($input.json('$.signature') != "")
  ${signature},
#end
#if ($input.params('date') != "")
  ${date}
#end
}`
```

Unfortunately, the above template does not always produce a valid JSON object.
It will end up with a dangling comma if `date` is omitted.

```json
{
  "username": "<username>",
  "signature": "<signature>",
}
```

We have do something like below:

```ts
`{
#if ($input.params('username') != "")
  ${username}
#end
#if ($input.json('$.signature') != "")
#if ($input.params('username') != "")
  ,
#end
  ${signature}
#end
#if ($input.params('date') != "")
#if (($input.params('username') != "") || ($input.json('$.signature') != ""))
  ,
#end
  ${date}
#end
}`
```

It is daunting, isn't it?
This library is intended to **relieve the pain of writing mapping templates** like the above.

## Example

You can rewrite the example in the previous section with this library into:

```ts
import { composeMappingTemplate, ifThen } from '@codemonger-io/mapping-template-compose';

composeMappingTemplate([
  ifThen(
    '$input.params("username") != ""',
    [['username', `"$util.escapeJavaScript($util.urlDecode($input.params("username"))).replaceAll("\\'", "'")"`]],
  ),
  ifThen(
    '$input.json("signature") != ""',
    [['signature', '$input.json("$.signature")']],
  ),
  ifThen(
    '$input.params("date") != ""',
    [['date', `"$util.escapeJavaScript($util.urlDecode($input.params("date"))).replaceAll("\\'", "'")"`]],
  ),
]);
```

You can make it further modular:

```ts
import { type KeyValue, composeMappingTemplate, ifThen } from '@codemonger-io/mapping-template-compose';

const username: KeyValue = ['username', `"$util.escapeJavaScript($util.urlDecode($input.params("username"))).replaceAll("\\'", "'")"`];
const signature: KeyValue = ['signature', '$input.json("$.signature")'];
const date: KeyValue = ['date', `"$util.escapeJavaScript($util.urlDecode($input.params("date"))).replaceAll("\\'", "'")"`];
const optionalUsername = ifThen('$input.params("username") != ""', [username]);
const optionalSignature = ifThen('$input.json("signature") != ""', [signature]);
const optionalDate = ifThen('$input.params("date") != ""', [date]);

composeMappingTemplate([
  optionalUsername,
  optionalSignature,
  optionalDate,
]);
```

## What mapping template can we compose?

What this library specifically does is only one thing: to determine **where to place a comma (",")**.
However, this seemingly trivial task turns out complicated as you can see in the example in [Section "Motivation"](#motivation).
Thus, not all of the possible patterns in mapping templates are supported.
For instance, looping is not supported yet.
Please refer to [`supported-patterns.md`](./supported-patterns.md) for what mapping template you can compose with this library.

## API documentation

You can find the API documentation in [`./api-docs/markdown` folder](./api-docs/markdown/index.md).

## Development

### Resolving dependencies

```sh
pnpm install --frozen-lockfile
```

### Building

```sh
pnpm build
```

### Testing

```sh
pnpm test
```

### Generating the API documentation

```sh
pnpm build:doc
```
