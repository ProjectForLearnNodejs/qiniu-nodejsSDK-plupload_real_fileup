# 通过七牛云SDK和plupload实现文件上传至七牛个人空间

## 一、使用库

### 1、nodejs-sdk

Node.js SDK 主要包含对七牛云存储API的包装，遵循qiniu sdkspec 涉及到以下几个方面：

* 服务端操作，生成上传授权(uptoken)，私有bucket下载URL(downloadUrl)，文件操作授权
* 客户端操作，上传文件(qiniu/io.js)
* 文件管理(qiniu/rs.js)
* 数据处理(qiniu/fop.js)
* 公共库(qiniu/rpc.js, qiniu/util.js)

git地址:https://github.com/qiniu/nodejs-sdk 

参考文档：
    http://developer.qiniu.com/   七牛开发者中心
       
### 2、plupload
Plupload 是一个Web浏览器上的界面友好的文件上传组件，可显示上传进度、图像自动缩略和上传分块，同时上传多个文件。Plupload 的上传文件的引擎使用Flash，Silverlight，HTML5，Gears，BrowserPlus或正常的FileUpload。

地址：: https://github.com/moxiecode/plupload  
参考文档：

plupload中文API: http://www.bubuko.com/infodetail-909829.html

form表单enctype属性详解:http://blog.sina.com.cn/s/blog_3d2d79aa010009js.html
## 二、概述通过七牛提供SDK实现文件直传
### 文件上传流程
* 客户端（终端用户） => 七牛 => 业务服务器

### 实现方式
1、客户端请求业务服务器获得 uptoken

2、客户端凭借 上传凭证 上传文件到七牛

3、善后工作，比如保存相关的一些信息

## 三、具体实现方式
### 1、获取上传凭证
获取上传凭证的主要是通过七牛nodejs-sdk的PutPolicy方法获取  

* 配置参数

        module.exports = {
            'ACCESS_KEY': 'CBk2qYIgebRVDFHqaYk0vf9Jp7hSAcIvKyw49qIx',   // 七牛个人账户公钥
            'SECRET_KEY': 'nNeq3K3ajI6NRQZzamyDxdbtnPnoXXjsn4af0V9n',   // 七牛个人账户私钥
            'Bucket_Name': 'qiniu-file-up',                             // 七牛-个人空间名
            'Port': 19111,
            'Uptoken_Url': '/api/fileupload/uptoken',               // 获取token路径
            'Domain': '7xqqm5.com1.z0.glb.clouddn.com'    // 七牛子域名，自定义域名。
        };
     
* 配置好参数后，即可生成token
       
        var qiniu = require('qiniu');
        // 配置公钥和私钥
        qiniu.conf.ACCESS_KEY = config.ACCESS_KEY; 
        qiniu.conf.SECRET_KEY = config.SECRET_KEY;
        var uptoken = new qiniu.rs.PutPolicy(config.Bucket_Name); // 生成的uptoken对象的token()方法会返回上传凭证
        var token = uptoken.token();    // 获得token

### 2、客户端直接上传文件至个人空间
通过plupload插件实现文件直传

    //实例化一个plupload上传对象
    uploader = new plupload.Uploader({
      runtimes: 'html5,flash,html4',
      browse_button : 'pickfiles', //触发文件选择对话框的按钮，为那个元素id
      url: 'http://upload.qiniu.com/',  // 服务器上传地址
      unique_names: true,
      multipart: true,
      multipart_params: {},     // 后续设置该从参数的值
    });

    //在实例对象上调用init()方法进行初始化
    uploader.init();

    // 当上传队列中的某一文件正要开始上传前触发
    uploader.bind('BeforeUpload', function(uploader, files){
      // 设置当前上传文件名和token
      uploader.setOption('multipart_params', {
        token: token,               // 上传凭证
        'key': files.name,        // 设置key，key即为存放在云上的文件名
      });
    });

    // 当文件添加到上传队列后触发,files为一数组（本次添加的文件对象数组）
    uploader.bind('FilesAdded',function(uploader, files){
      var html = '';
      for(var i=0; i<files.length; i++) {
        html = '<tr>'
                +'<td>'+files[i].name+'</td>'
                +'<td>'+files[i].size+'B'+'</td>'
                +'<td>'+'未上传'+'</td>'
        '</tr>';
        $('#file-info tbody').append(html);
      }
    });

    // 文件上传过程中不断触发，可以用此事件来显示上传进度
    uploader.bind('UploadProgress',function(uploader,file){
    });

    // 当当前上传文件队列中的所有文件都已上传完时触发
    uploader.bind('UploadComplete',function(uploader,file){
      // 修改表格状态
      $('#file-info tbody tr').each(function(index, ele){
        var text = $(this).find('td:eq(2)').text();
        if(text == '未上传') {
          $(this).find('td:eq(2)').text('已上传');
        }
      });
      // 清空文件队列
      file.length = 0 ;
    });

    //最后给"开始上传"按钮注册事件
    document.getElementById('start_upload').onclick = function(){
      // 查看文件队列中是否有文件已被选中 TODO
      if(uploader.files.length == 0) {
        jAlert("请添加需要上传的文件！", "提示");
      }
      uploader.start(); //调用实例对象的start()方法开始上传文件，当然你也可以在其他地方调用该方法
    }

## 四、资源的下载
七牛个人账户的空间默认是公有的，公有的空间访问时是不需要下载凭证的，私有的空间需要进行实名认证后，才可将空间配置为私有！

### 1、公开资源下载非常简单，以HTTP GET方式访问资源URL即可。资源URL的构成如下：

    http://<domain>/<key>   // domain为个人的自定义域名，key即为资源名
    
### 2、私有资源的下载
当将个人账户的空间设置成私有后，所有对空间内资源的访问都必须获得授权

私有资源下载也是通过以HTTP GET方式访问一个特定URL完成。私有资源URL与公开资源URL相比只是增加了两个参数e和token，分别表示过期时间和下载凭证。一个完整的私有资源URL如下所示：

    http://<domain>/<key>?e=<deadline>&token=<downloadToken>
    
参考文档：

下载安全机制： http://developer.qiniu.com/docs/v6/api/overview/dn/security.html
    
### 3、图片的预览
图片的预览其实是将图片下载即可！

图片查看原图的效果使用库materialize链接: http://materializecss.com/media.html



## 五、总结
### 1、本例使用的实现方式是:

* 1、客户端请求业务服务器获得 uptoken

* 2、客户端凭借 上传凭证 上传文件到七牛

* 3、善后工作，比如保存相关的一些信息

即：

        客户端（终端用户） => 七牛 => 业务服务器

注:此种方式使用了plupload插件来协助完成。

后续添加另一项目实现文件上传的方式为:

        客户端（终端用户） => 业务服务器 => 云存储服务

注:此种方式只适用七牛云提供的nodejs-sdk来实现！