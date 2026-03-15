package com.cpt202_1.taskmanager.pojo.enums;

public enum UserRole {
    ADMIN_REVIEWER,
/*管理员
审批 contributor 资格
查看待审核资源
审核通过 / 驳回资源
归档资源
创建和管理 category、tag
管理平台内容流程*/
    CONTRIBUTOR,//投稿者
    REGISTERED_VIEWER//普通注册用户
}
