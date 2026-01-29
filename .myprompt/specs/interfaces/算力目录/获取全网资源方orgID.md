# 算力详情

## 1. 接口描述

* **接口名称** ：/computingResource/getGlobalGroupOrgID
* **接口说明** ：获取全网资源方partyId以及企业名称列表
* 请求方式：GET

## 2. 输入参数

无


## 3. 输出参数

| **参数名称**         | **类型**                   | **描述**                   |
| ------------------  | --------------            | --------------------------------------------------------------------- |
| partIdEntNameMap    | Map[partId]EntName | 参与方ID和企业名称映射表|


## 4. 示例

### （1）输入

无

### （2）输出

```json
{
    "code": 200,
    "msg": "",
    "data": {
        "partIdEntNameMap":{
            "1":[
                "企业1",
                "企业2"
            ],
            "2":[
                "企业3",
                "企业4"
            ]
        }
    }
}
```


## 5. 数据结构

### data

| 参数名称                | 参数类型               | 参数说明   |
| -----------            | --------             | ----------|
| partIdEntNameMap       | Map[partId]EntName   | 参与方ID和企业名称映射表    |
| partId                 | String               | 参与方ID    |
| EntName                | String               | 企业名称  |
