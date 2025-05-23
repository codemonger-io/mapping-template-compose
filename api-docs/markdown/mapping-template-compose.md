<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@codemonger-io/mapping-template-compose](./mapping-template-compose.md)

## mapping-template-compose package

Compose API Gateway mapping templates.

## Functions

<table><thead><tr><th>

Function


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[andCommaConditions(conditions)](./mapping-template-compose.andcommaconditions.md)


</td><td>

**_(BETA)_** ANDs given conditions that determine if a comma is necessary.


</td></tr>
<tr><td>

[composeMappingTemplate(items)](./mapping-template-compose.composemappingtemplate.md)


</td><td>

**_(BETA)_** Composes a mapping template for Amazon API Gateway.


</td></tr>
<tr><td>

[getCommaConditionAfterIfBlock(ifBlock)](./mapping-template-compose.getcommaconditionafterifblock.md)


</td><td>

**_(BETA)_** Returns the condition in which a trailing comma is necessary after a given [IfBlock](./mapping-template-compose.ifblock.md)<!-- -->.


</td></tr>
<tr><td>

[getCommaConditionAfterItem(item)](./mapping-template-compose.getcommaconditionafteritem.md)


</td><td>

**_(BETA)_** Returns the condition in which a trailing comma is necessary after a given item.


</td></tr>
<tr><td>

[ifThen(condition, thenBlock)](./mapping-template-compose.ifthen.md)


</td><td>

**_(BETA)_** Creates an `IfBlock` that has only the then-block.


</td></tr>
<tr><td>

[ifThenElse(condition, thenBlock, elseBlock)](./mapping-template-compose.ifthenelse.md)


</td><td>

**_(BETA)_** Creates an `IfBlock` that has then- and else-blocks.


</td></tr>
<tr><td>

[isKeyValue(item)](./mapping-template-compose.iskeyvalue.md)


</td><td>

**_(BETA)_** Returns if a given value is a [KeyValue](./mapping-template-compose.keyvalue.md)<!-- -->.


</td></tr>
<tr><td>

[orCommaConditions(conditions)](./mapping-template-compose.orcommaconditions.md)


</td><td>

**_(BETA)_** ORs given conditions that determine if a comma is necessary.


</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Interface


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[IfBlock](./mapping-template-compose.ifblock.md)


</td><td>

**_(BETA)_** If block.


</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Type Alias


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[KeyValue](./mapping-template-compose.keyvalue.md)


</td><td>

**_(BETA)_** Key-value pair.


</td></tr>
<tr><td>

[MappingTemplateItem](./mapping-template-compose.mappingtemplateitem.md)


</td><td>

**_(BETA)_** Item constituting a mapping template.


</td></tr>
</tbody></table>
