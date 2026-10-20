package com.ustarenovasyon.boxantrenman;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.JavaScriptReplyProxy;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewCompat;
import androidx.webkit.WebViewFeature;
import org.json.JSONObject;
import java.io.ByteArrayInputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Collections;

public class MainActivity extends Activity {
    static final String HOST="appassets.androidplatform.net";
    static final String ORIGIN="https://"+HOST;
    private static final int SAVE_JSON=101, OPEN_JSON=102;
    private WebView webView;
    private ValueCallback<Uri[]> upload;
    private String pendingJson, pendingId;
    private JavaScriptReplyProxy pendingReply;
    private long pausedAt=0;

    public WebView getAppWebView() { return webView; }
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        if(!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            new AlertDialog.Builder(this).setTitle("Android System WebView güncellemesi gerekli").setMessage("Uygulamayı kullanmak için Android System WebView bileşenini güncelle ve tekrar aç.").setPositiveButton("Kapat",(dialog,which)->finish()).show();return;
        }
        webView=new WebView(this);
        webView.setOnApplyWindowInsetsListener((view,insets)->{view.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());return insets;});
        setContentView(webView);
        WebSettings settings=webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setUserAgentString(settings.getUserAgentString()+" BoxAndroid/1.0");
        final WebViewAssetLoader loader=new WebViewAssetLoader.Builder().addPathHandler("/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
        webView.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request) {
                Uri uri=request.getUrl();
                if(!HOST.equals(uri.getHost())||!"https".equals(uri.getScheme()))return blocked();
                if(request.isForMainFrame()&&isAppRoute(uri.getPath())) {
                    try{return new WebResourceResponse("text/html","UTF-8",getAssets().open("index.html"));}catch(Exception e){return blocked();}
                }
                return loader.shouldInterceptRequest(uri);
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request) {
                Uri uri=request.getUrl();
                if(HOST.equals(uri.getHost())&&"https".equals(uri.getScheme()))return false;
                if(request.hasGesture()&&"https".equals(uri.getScheme()))try{startActivity(new Intent(Intent.ACTION_VIEW,uri));}catch(Exception ignored){}
                return true;
            }
        });
        WebViewCompat.addWebMessageListener(webView,"BoxAndroid",Collections.singleton(ORIGIN),(view,message,origin,mainFrame,reply)->{
            if(!mainFrame||!ORIGIN.equals(origin.toString()))return;
            String id="";
            try {
                JSONObject body=new JSONObject(message.getData());id=body.optString("id");
                if(!"exportBackup".equals(body.optString("operation")))throw new Exception("Desteklenmeyen işlem.");
                if(pendingReply!=null)throw new Exception("Önce açık dosya kaydını tamamla.");
                String json=body.getString("json"),name=body.getString("filename");
                if(!name.matches("[A-Za-z0-9._-]{1,100}\\.json")||json.length()>100*1024*1024||!"box-antrenman-backup".equals(new JSONObject(json).optString("format")))throw new Exception("Yedek dosyası geçersiz.");
                pendingJson=json;pendingId=id;pendingReply=reply;
                Intent intent=new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json").putExtra(Intent.EXTRA_TITLE,name);
                startActivityForResult(intent,SAVE_JSON);
            } catch(Exception e) {if(pendingReply==reply){pendingReply=null;pendingJson=null;pendingId=null;}sendReply(reply,id,false,"Yedek kaydedilemedi: "+e.getMessage());}
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams params) {
                if(upload!=null)upload.onReceiveValue(null);upload=callback;
                try {Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("application/json");startActivityForResult(intent,OPEN_JSON);return true;}
                catch(Exception error){upload=null;callback.onReceiveValue(null);return true;}
            }
            @Override public boolean onJsConfirm(WebView view,String url,String message,android.webkit.JsResult result) {
                new AlertDialog.Builder(MainActivity.this).setMessage(message).setPositiveButton("Onayla",(dialog,which)->result.confirm()).setNegativeButton("Vazgeç",(dialog,which)->result.cancel()).setOnCancelListener(dialog->result.cancel()).show();return true;
            }
        });
        webView.loadUrl(ORIGIN+"/");
    }
    private static boolean isAppRoute(String path) {
        return "/".equals(path)||"/index.html".equals(path)||"/programs".equals(path)||"/program-create".equals(path)||"/workout".equals(path)||"/history".equals(path)||"/settings".equals(path)||(path!=null&&path.startsWith("/program-preview/"));
    }
    private static WebResourceResponse blocked() {return new WebResourceResponse("text/plain","UTF-8",403,"Blocked",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
    private static void sendReply(JavaScriptReplyProxy proxy,String id,boolean ok,String error) {
        try {JSONObject reply=new JSONObject();reply.put("id",id);reply.put("ok",ok);reply.put("error",error);proxy.postMessage(reply.toString());}catch(Exception ignored){}
    }
    @Override protected void onActivityResult(int code,int result,Intent data) {
        super.onActivityResult(code,result,data);
        if(code==OPEN_JSON&&upload!=null){Uri uri=data==null?null:data.getData();upload.onReceiveValue(result==RESULT_OK&&uri!=null&&"content".equals(uri.getScheme())?new Uri[]{uri}:null);upload=null;}
        if(code==SAVE_JSON&&pendingReply!=null) {
            boolean ok=false;String error="Dosya kaydı iptal edildi.";
            if(result==RESULT_OK&&data!=null&&data.getData()!=null)try(OutputStream stream=getContentResolver().openOutputStream(data.getData(),"wt")){if(stream==null)throw new Exception("Dosya açılamadı.");stream.write(pendingJson.getBytes(StandardCharsets.UTF_8));ok=true;error="";}catch(Exception e){error="Dosya kaydedilemedi: "+e.getMessage();}
            sendReply(pendingReply,pendingId,ok,error);pendingReply=null;pendingJson=null;pendingId=null;
        }
    }
    private void pauseWorkout(long at) {if(webView!=null)webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('box:native-pause',{detail:{nowMs:"+at+"}}))",null);}
    @Override protected void onPause(){pausedAt=System.currentTimeMillis();pauseWorkout(pausedAt);if(webView!=null)webView.onPause();super.onPause();}
    @Override protected void onResume(){super.onResume();if(webView!=null){webView.onResume();if(pausedAt>0)pauseWorkout(pausedAt);}}
    @Override public void onBackPressed(){if(webView!=null&&webView.canGoBack())webView.goBack();else super.onBackPressed();}
    @Override protected void onDestroy(){if(upload!=null)upload.onReceiveValue(null);if(webView!=null)webView.destroy();super.onDestroy();}
}
