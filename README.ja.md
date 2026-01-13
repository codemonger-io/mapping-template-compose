[English](./README.md) / 日本語

# Mapping Template Compose

[Amazon API Gateway](https://aws.amazon.com/api-gateway/)の[マッピングテンプレート](https://docs.aws.amazon.com/apigateway/latest/developerguide/rest-api-data-transformations.html)をコンポーネントの組み合わせで構築できるようにします。

このライブラリは[AWS Cloud Development Kit](https://aws.amazon.com/cdk/)と組み合わせると特に強力です。

## ライブラリをインストールする

```sh
npm install https://github.com/codemonger-io/mapping-template-compose.git#v0.2.1
```

### GitHub Packagesからインストールする

`main`ブランチにコミットがプッシュされるたびに、*開発者用パッケージ*がGitHub Packagesの管理するnpmレジストリにパブリッシュされます。
*開発者用パッケージ*のバージョンは次のリリースバージョンにハイフン(`-`)と短いコミットハッシュをつなげものになります。例、`0.2.1-abc1234` (`abc1234`はパッケージをビルドするのに使ったコミット(*スナップショット*)の短いコミットハッシュ)。
*開発者用パッケージ*は[こちら](https://github.com/codemonger-io/mapping-template-compose/pkgs/npm/mapping-template-compose)にあります。

#### GitHubパーソナルアクセストークンの設定

*開発者用パッケージ*をインストールするには、最低限`read:packages`スコープの**クラシック**GitHubパーソナルアクセストークン(PAT)を設定する必要があります。
以下、簡単にPATの設定方法を説明します。
より詳しくは[GitHubのドキュメント](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)をご参照ください。

PATが手に入ったら以下の内容の`.npmrc`ファイルをホームディレクトリに作成してください。

```sh
//npm.pkg.github.com/:_authToken=$YOUR_GITHUB_PAT
```

`$YOUR_GITHUB_PAT`はご自身のPATに置き換えてください。

プロジェクトのルートディレクトリに以下の内容の`.npmrc`ファイルを作成してください。

```sh
@codemonger-io:registry=https://npm.pkg.github.com
```

これで以下のコマンドで*開発者用パッケージ*をインストールできます。

```sh
npm install @codemonger-io/mapping-template-compose@0.2.1-abc1234
```

`abc1234`はインストールしたい*スナップショット*の短いコミットハッシュに置き換えてください。

## 動機

Amazon API Gatewayのマッピングテンプレートを記述するのを面倒くさいと感じたことはありますか?
私はマッピングテンプレートを書くのに嫌気がさしています。というのも
1. ボイラープレートコードをたくさん書かなければならない。例えば、クエリーパラメータをプロパティにする場合:

    ```json
    "username": "$util.escapeJavaScript($util.urlDecode($input.params("username"))).replaceAll("\\'", "'")"
    ```

2. マッピングテンプレートの構成要素を再利用するのが難しい。

2番目の問題について、一番難しいのはマッピングテンプレートから有効なJSON形式が確実に生成されるようにすることです。

以下のようなプロパティ定義がコンポーネントとして利用できるとしましょう。

```ts
const username = `"username": "$util.escapeJavaScript($util.urlDecode($input.params("username"))).replaceAll("\\'", "'")"`;
const signature = `"signature": $input.json("$.signature")`;
const date = `"date": "$util.escapeJavaScript($util.urlDecode($input.params("date"))).replaceAll("\\'", "'")"`;
```

上記のすべてのプロパティを持つシンプルなオブジェクトを構築したいとします。

```json
{
  "username": "$util.escapeJavaScript($util.urlDecode($input.params("username"))).replaceAll("\\'", "'")",
  "signature": $input.json("$.signature"),
  "date": "$util.escapeJavaScript($util.urlDecode($input.params("date"))).replaceAll("\\'", "'")"
}
```

`date`プロパティの後のカンマを省略しなければなりませんが、これはむしろ単純です。

```ts
`{
  ${[username, signature, date].join(',\n  ')}
}`
```

ではすべてのプロパティが省略できるとしたらどうでしょうか?
以下のようなコードを思いつくかもしれません。

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

残念ながら、上記のテンプレートは必ずしも有効なJSONオブジェクトを生成しません。
`date`が省略されると、末尾に余計なカンマが残ってしまいます。

```json
{
  "username": "<username>",
  "signature": "<signature>",
}
```

以下のようにしなければならないでしょう。

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

先が思いやられますよね?
このライブラリは上記のような**マッピングテンプレートを書く苦痛を和らげる**ことを目的としています。

## サンプル

このライブラリを用いると前節の例は以下のように書き換えられます。

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

さらにモジュール化することもできます。

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

## どんなマッピングテンプレートを記述できる?

このライブラリが特別に行なっていることはただの一点、**カンマ(",")をどこに置くか**を決めることです。
ところが、この簡単そうなタスクは[「動機」の節](#motivation)で紹介したとおり案外複雑です。
ということで、マッピングテンプレートを記述するすべてのパターンがサポートされているわけではありません。
例えば、ループはまだサポートされていません。
どのようなマッピングテンプレートを記述可能かについては[`supported-patterns.md`](./supported-patterns.md)をご覧ください(英語版のみ)。

## APIドキュメント

APIドキュメントは[`./api-docs/markdown`フォルダ](./api-docs/markdown/index.md)にあります(英語版のみ)。

## 開発

### 依存関係の解決

```sh
pnpm install --frozen-lockfile
```

### ビルド

```sh
pnpm build
```

### テスト

```sh
pnpm test
```

### APIドキュメントの生成

```sh
pnpm build:doc
```
