package com.ustarenovasyon.boxantrenman;

import static org.junit.Assert.*;
import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.Until;
import androidx.lifecycle.Lifecycle;
import android.os.SystemClock;
import java.util.concurrent.CountDownLatch;
import java.util.regex.Pattern;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;
import org.json.JSONArray;
import org.json.JSONTokener;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class OfflineAppTest {
    @Rule public ActivityScenarioRule<MainActivity> activity=new ActivityScenarioRule<>(MainActivity.class);
    private String js(String code) throws Exception {
        CountDownLatch done=new CountDownLatch(1);String[] value={null};
        activity.getScenario().onActivity(host->{assertNotNull("WebView must be available",host.getAppWebView());host.getAppWebView().evaluateJavascript(code,result->{value[0]=result;done.countDown();});});
        assertTrue("JavaScript callback",done.await(10,TimeUnit.SECONDS));return value[0];
    }
    private String body() throws Exception {Object value=new JSONTokener(js("document.body.innerText")).nextValue();return String.valueOf(value);}
    private void contains(String text) throws Exception {for(int i=0;i<120;i++){if(body().contains(text))return;SystemClock.sleep(200);}fail("Missing UI: "+text+"; actual: "+body());}
    private void click(String tag,String text) throws Exception {
        String lookup="Array.from(document.querySelectorAll("+JSONObject.quote(tag)+")).find(e=>e.textContent.trim()==="+JSONObject.quote(text)+")";
        for(int i=0;i<100;i++) {
            if("true".equals(js("(function(){var e="+lookup+";if(!e)return false;e.scrollIntoView({block:'center'});return true;})()"))) {
                SystemClock.sleep(200);
                JSONArray point=new JSONArray(js("(function(){var r=("+lookup+").getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2,innerWidth];})()"));
                int[] origin=new int[2],width={0};activity.getScenario().onActivity(host->{host.getAppWebView().getLocationOnScreen(origin);origin[0]+=host.getAppWebView().getPaddingLeft();origin[1]+=host.getAppWebView().getPaddingTop();width[0]=host.getAppWebView().getWidth()-host.getAppWebView().getPaddingLeft()-host.getAppWebView().getPaddingRight();});
                double scale=width[0]/point.getDouble(2);UiDevice.getInstance(InstrumentationRegistry.getInstrumentation()).click(origin[0]+(int)(point.getDouble(0)*scale),origin[1]+(int)(point.getDouble(1)*scale));SystemClock.sleep(200);return;
            }
            SystemClock.sleep(200);
        }
        fail("Missing control: "+text+"; "+body());
    }
    @Test public void offlineProgramTimerNativeBackupAndRestore() throws Exception {
        contains("İlk antrenman programını oluştur.");assertEquals("true",js("typeof window.BoxAndroid.postMessage==='function'"));
        click("a","Yeni program oluştur");click("button","Sadece Boks");contains("Program Süresi");click("button","1 Ay");click("button","1");click("button","Pazartesi");click("button","Başlangıç");click("button","Sol Gard (Orthodox)");click("button","Program Oluştur");contains("Program Önizleme");click("button","Programı Gözden Geçir");click("button","Onayla ve Programı Başlat");click("button","Onayla ve Başlat");contains("Aktif");
        click("a","Ana Sayfa");click("a","Antrenmana git");click("button","Antrenmanı başlat");contains("Çalışıyor");SystemClock.sleep(2300);
        activity.getScenario().moveToState(Lifecycle.State.CREATED);SystemClock.sleep(1200);activity.getScenario().moveToState(Lifecycle.State.RESUMED);contains("Duraklatıldı");
        String position="document.querySelector('progress[aria-label=\"Antrenman ilerlemesi\"]').value";double retained=Double.parseDouble(js(position));assertTrue("Real elapsed checkpoint",retained>0&&retained<7000);SystemClock.sleep(1200);assertEquals(retained,Double.parseDouble(js(position)),0.0);
        activity.getScenario().recreate();contains("AKTİF PROGRAM");click("a","Antrenmana git");contains("Duraklatıldı");assertEquals(retained,Double.parseDouble(js(position)),0.0);
        click("a","Ayarlar");contains("Android uygulaması");click("button","JSON yedeğini indir");
        UiDevice device=UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());UiObject2 save=device.wait(Until.findObject(By.text(Pattern.compile("(?i)save|kaydet"))),10000);assertNotNull("Android create-document UI",save);save.click();contains("Yedek dosyası hazırlandı.");
        click("button","JSON yedeği seç");UiObject2 file=device.wait(Until.findObject(By.text(Pattern.compile("box-antrenman-.*\\.json"))),10000);assertNotNull("Saved JSON in native document picker",file);file.click();contains("Yedek doğrulandı.");click("button","Doğrulanan yedeği geri yükle");contains("Android uygulaması");
        activity.getScenario().recreate();contains("AKTİF PROGRAM");click("a","Antrenmana git");contains("Duraklatıldı");assertEquals(retained,Double.parseDouble(js(position)),0.0);assertFalse(body().contains("Program bütünlüğü doğrulanamadı"));
        device.pressBack();contains("AKTİF PROGRAM");
    }
}
